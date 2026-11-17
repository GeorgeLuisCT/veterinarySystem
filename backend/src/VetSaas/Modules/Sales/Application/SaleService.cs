using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Modules.Inventory.Application;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Modules.Sales.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Sales.Application;

/// <summary>Busca el adaptador de cada tipo de servicio facturable.</summary>
public sealed class BillableServiceRegistry
{
    private readonly Dictionary<BillableServiceType, IBillableServiceAdapter> _adapters;

    public BillableServiceRegistry(IEnumerable<IBillableServiceAdapter> adapters) =>
        _adapters = adapters.ToDictionary(a => a.SupportsType);

    private IBillableServiceAdapter Get(BillableServiceType type) =>
        _adapters.TryGetValue(type, out var adapter)
            ? adapter
            : throw new BadRequestException("Tipo de servicio facturable no soportado: " + type);

    public Task<BillableServiceItem> FetchItemAsync(BillableServiceType type, long itemId, CancellationToken ct) =>
        Get(type).GetBillableItemAsync(itemId, ct);

    public Task MarkAsBilledAsync(BillableServiceType type, long itemId, long saleDetailId, CancellationToken ct) =>
        Get(type).MarkAsBilledAsync(itemId, saleDetailId, ct);

    public Task MarkAsUnbilledAsync(BillableServiceType type, long itemId, CancellationToken ct) =>
        Get(type).MarkAsUnbilledAsync(itemId, ct);

    public async Task<List<BillableServiceItem>> ListPendingAsync(long? branchId, long? attentionId, long? patientId, string? query,
        CancellationToken ct)
    {
        string? normalized = string.IsNullOrWhiteSpace(query) ? null : query.Trim();
        var all = new List<BillableServiceItem>();
        foreach (IBillableServiceAdapter adapter in _adapters.Values)
            all.AddRange(await adapter.ListPendingAsync(branchId, attentionId, patientId, normalized, ct));
        return all;
    }
}

public interface ISaleService
{
    Task<SaleResponse> CreateAsync(CreateSaleRequest request, CancellationToken ct = default);
    Task<SaleResponse> UpdateAsync(long id, UpdateSaleRequest request, CancellationToken ct = default);
    Task<SaleResponse> GetAsync(long id, CancellationToken ct = default);
    Task<PaginatedResponse<SaleSummaryResponse>> ListAsync(SaleListFilter filter, CancellationToken ct = default);
    Task<List<SaleSummaryResponse>> ListPendingAsync(long? branchId, CancellationToken ct = default);
    Task<SaleResponse> VoidAsync(long id, VoidSaleRequest request, CancellationToken ct = default);
    Task<List<BillableServiceItem>> ListBillableItemsAsync(long? branchId, long? attentionId, long? patientId, string? q, CancellationToken ct = default);
    Task<SaleResponse> AddDetailAsync(long id, SaleItemRequest request, CancellationToken ct = default);
    Task<SaleResponse> UpdateDetailAsync(long id, long detailId, SaleItemRequest request, CancellationToken ct = default);
    Task DeleteDetailAsync(long id, long detailId, CancellationToken ct = default);
    Task<SaleResponse> AddPaymentAsync(long id, SalePaymentRequest request, CancellationToken ct = default);
    Task<SaleResponse> UpdatePaymentAsync(long id, long paymentId, SalePaymentRequest request, CancellationToken ct = default);
    Task DeletePaymentAsync(long id, long paymentId, CancellationToken ct = default);
    Task<SaleResponse> FinalizeAsync(long id, FinalizeSaleRequest request, CancellationToken ct = default);
}

public sealed class SaleService : ISaleService
{
    private const string SaleDetailOrigin = "SALE_DETAIL";
    private const string SaleVoidOrigin = "SALE_DETAIL_VOID";

    private readonly TenantDbContext _db;
    private readonly IKardexService _kardex;
    private readonly BillableServiceRegistry _billables;
    private readonly IClock _clock;

    public SaleService(TenantDbContext db, IKardexService kardex, BillableServiceRegistry billables, IClock clock)
    {
        _db = db;
        _kardex = kardex;
        _billables = billables;
        _clock = clock;
    }

    private static decimal Money(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
    private static decimal Qty(decimal value) => Math.Round(value, 3, MidpointRounding.AwayFromZero);

    private IQueryable<Sale> Full() => _db.Sales
        .Include(s => s.Branch)
        .Include(s => s.Seller).ThenInclude(u => u.Employee)
        .Include(s => s.Customer)
        .Include(s => s.Details).ThenInclude(d => d.SaleMode)
        .Include(s => s.Details).ThenInclude(d => d.Product)
        .Include(s => s.Details).ThenInclude(d => d.ProductBatch)
        .Include(s => s.Payments)
        .AsSplitQuery();

    private static SaleResponse ToResponse(Sale s) => new(s.Id, s.BranchId, s.Branch.Name, s.SellerId, s.Seller.Employee.FullName,
        s.CustomerId, s.Customer?.Name, s.Status, s.DocumentType, s.DocumentNumber, s.Subtotal, s.TaxTotal, s.GrandTotal,
        s.CreatedAt, s.UpdatedAt, s.VoidedAt, s.VoidReason, s.SourceAttentionId, s.Notes,
        s.Details.OrderBy(d => d.Id).Select(SaleDetailResponse.From).ToList(),
        s.Payments.OrderBy(p => p.Id).Select(SalePaymentResponse.From).ToList());

    private async Task<SaleResponse> ReloadAsync(long id, CancellationToken ct)
    {
        _db.ChangeTracker.Clear();
        return ToResponse(await Full().AsNoTracking().FirstAsync(s => s.Id == id, ct));
    }

    private async Task<Sale> GetDraftAsync(long id, CancellationToken ct)
    {
        Sale sale = await Full().FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new NotFoundException("Venta no encontrada con ID: " + id);
        if (sale.Status != SaleStatus.DRAFT)
            throw new BadRequestException("Solo se puede modificar una venta en estado DRAFT (borrador)");
        return sale;
    }

    private void Touch(Sale sale) => sale.UpdatedAt = _clock.Now;

    // ---- Crear / editar ----

    public Task<SaleResponse> CreateAsync(CreateSaleRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            bool finalize = request.FinalizeSale;
            var branch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == request.BranchId, ct)
                ?? throw new NotFoundException("Sucursal no encontrada");
            var seller = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.SellerId, ct)
                ?? throw new NotFoundException("Usuario vendedor no encontrado");
            Customer? customer = request.CustomerId is null
                ? null
                : await _db.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId, ct) ?? throw new NotFoundException("Cliente no encontrado");

            DateTime now = _clock.Now;
            var sale = new Sale
            {
                Branch = branch, Seller = seller, Customer = customer, DocumentType = request.DocumentType,
                DocumentNumber = request.DocumentNumber, Notes = request.Notes, CreatedAt = now, UpdatedAt = now,
            };

            var reservedByBatch = new Dictionary<long, decimal>();
            foreach (SaleItemRequest item in request.Items!)
                sale.Details.AddRange(await MapDetailsAsync(sale, branch.Id, item, reservedByBatch, ct));
            RecalculateTotals(sale);

            foreach (SalePaymentRequest payment in request.Payments ?? new())
                sale.Payments.Add(await MapPaymentAsync(sale, branch.Id, payment, ct));

            if (finalize)
            {
                if (sale.Payments.Sum(p => p.AmountPaid) < sale.GrandTotal)
                    throw new BadRequestException("El total pagado es menor al total de la venta");
                SettleChange(sale);
                sale.Status = SaleStatus.COMPLETED;
            }
            else sale.Status = SaleStatus.DRAFT;

            _db.Sales.Add(sale);
            await _db.SaveChangesAsync(ct);
            if (finalize) await ApplyCompletionEffectsAsync(sale, ct);
            return await ReloadAsync(sale.Id, ct);
        }, ct);

    public Task<SaleResponse> UpdateAsync(long id, UpdateSaleRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Sale sale = await GetDraftAsync(id, ct);
            if (request.BranchId is not null && request.BranchId != sale.BranchId)
            {
                if (sale.Details.Count > 0 || sale.Payments.Count > 0)
                    throw new BadRequestException("No se puede cambiar la sucursal de una venta que ya tiene ítems o pagos");
                sale.Branch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == request.BranchId, ct)
                    ?? throw new NotFoundException("Sucursal no encontrada");
            }
            if (request.SellerId is not null && request.SellerId != sale.SellerId)
                sale.Seller = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.SellerId, ct)
                    ?? throw new NotFoundException("Usuario vendedor no encontrado");
            if (request.CustomerId is not null)
            {
                if (sale.CustomerId != request.CustomerId)
                    sale.Customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId, ct)
                        ?? throw new NotFoundException("Cliente no encontrado");
            }
            else
            {
                sale.Customer = null;
                sale.CustomerId = null;
            }
            sale.DocumentType = request.DocumentType;
            sale.DocumentNumber = request.DocumentNumber;
            sale.Notes = request.Notes;
            sale.SourceAttentionId = request.SourceAttentionId;
            Touch(sale);
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(sale.Id, ct);
        }, ct);

    public async Task<SaleResponse> GetAsync(long id, CancellationToken ct = default) =>
        ToResponse(await Full().AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct) ?? throw new NotFoundException("Venta no encontrada"));

    public async Task<PaginatedResponse<SaleSummaryResponse>> ListAsync(SaleListFilter f, CancellationToken ct = default)
    {
        IQueryable<Sale> query = _db.Sales.AsNoTracking();
        if (f.BranchId is > 0) query = query.Where(s => s.BranchId == f.BranchId);
        if (f.CustomerId is > 0) query = query.Where(s => s.CustomerId == f.CustomerId);
        if (f.SellerId is > 0) query = query.Where(s => s.SellerId == f.SellerId);
        if (f.Status is not null) query = query.Where(s => s.Status == f.Status);
        if (f.DocumentType is not null) query = query.Where(s => s.DocumentType == f.DocumentType);
        if (!string.IsNullOrWhiteSpace(f.DocumentNumber))
        {
            string like = $"%{f.DocumentNumber.Trim()}%";
            query = query.Where(s => EF.Functions.ILike(s.DocumentNumber!, like));
        }
        if (f.StartDate is not null) query = query.Where(s => s.CreatedAt >= f.StartDate);
        if (f.EndDate is not null) query = query.Where(s => s.CreatedAt <= f.EndDate);
        if (!string.IsNullOrWhiteSpace(f.Q))
        {
            string like = $"%{f.Q.Trim()}%";
            query = query.Where(s => EF.Functions.ILike(s.DocumentNumber!, like) ||
                                     (s.Customer != null && (EF.Functions.ILike(s.Customer.Name, like) ||
                                                             EF.Functions.ILike(s.Customer.DocumentNumber, like))));
        }
        return await query.OrderByDescending(s => s.CreatedAt).ThenByDescending(s => s.Id)
            .Select(s => new SaleSummaryResponse(s.Id, s.DocumentType, s.DocumentNumber, s.Status, s.GrandTotal, s.CreatedAt,
                s.BranchId, s.SellerId, s.CustomerId, s.Customer != null ? s.Customer.Name : null))
            .ToPageAsync(f.Page, f.Size, ct);
    }

    public async Task<List<SaleSummaryResponse>> ListPendingAsync(long? branchId, CancellationToken ct = default)
    {
        IQueryable<Sale> query = _db.Sales.AsNoTracking().Include(s => s.Customer).Where(s => s.Status == SaleStatus.DRAFT);
        if (branchId is > 0) query = query.Where(s => s.BranchId == branchId);
        return (await query.OrderBy(s => s.Id).ToListAsync(ct)).Select(SaleSummaryResponse.From).ToList();
    }

    public Task<SaleResponse> VoidAsync(long id, VoidSaleRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Sale sale = await Full().FirstOrDefaultAsync(s => s.Id == id, ct) ?? throw new NotFoundException("Venta no encontrada");
            if (sale.Status == SaleStatus.VOIDED) throw new BadRequestException("La venta ya se encuentra anulada");
            if (sale.Status != SaleStatus.COMPLETED) throw new BadRequestException("Solo se pueden anular ventas completadas");
            if (await _db.SalePayments.AnyAsync(p => p.SaleId == sale.Id && p.CashSession.Status == CashSessionStatus.CLOSED, ct))
                throw new BadRequestException("No se puede anular: el cobro pertenece a una caja ya cerrada. " +
                                              "Solicita al administrador la devolución desde tesorería.");

            sale.Status = SaleStatus.VOIDED;
            sale.VoidedAt = _clock.Now;
            sale.VoidReason = request.Reason;
            Touch(sale);
            await _db.SaveChangesAsync(ct);

            // Devuelve al stock cada línea de producto y libera los servicios para volver a cobrarlos.
            foreach (SaleDetail detail in sale.Details.Where(d => d.ProductId is not null))
                await _kardex.RegisterMovementAsync(new KardexRegistration(detail.ProductId!.Value, sale.BranchId, detail.ProductBatchId,
                    detail.Quantity, detail.UnitType ?? detail.Product?.UnitType ?? ProductUnitType.UNIT,
                    KardexMovementType.ADJUSTMENT_ENTRY, detail.Id, SaleVoidOrigin), ct);
            foreach (SaleDetail detail in sale.Details.Where(d => d.ServiceType is not null && d.ServiceItemId is not null))
                await _billables.MarkAsUnbilledAsync(detail.ServiceType!.Value, detail.ServiceItemId!.Value, ct);
            return await ReloadAsync(sale.Id, ct);
        }, ct);

    public Task<List<BillableServiceItem>> ListBillableItemsAsync(long? branchId, long? attentionId, long? patientId, string? q,
        CancellationToken ct = default) => _billables.ListPendingAsync(branchId, attentionId, patientId, q, ct);

    // ---- Ítems y pagos de un borrador ----

    public Task<SaleResponse> AddDetailAsync(long id, SaleItemRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Sale sale = await GetDraftAsync(id, ct);
            sale.Details.AddRange(await MapDetailsAsync(sale, sale.BranchId, request, new Dictionary<long, decimal>(), ct));
            RecalculateTotals(sale);
            Touch(sale);
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(sale.Id, ct);
        }, ct);

    public Task<SaleResponse> UpdateDetailAsync(long id, long detailId, SaleItemRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Sale sale = await GetDraftAsync(id, ct);
            SaleDetail existing = sale.Details.FirstOrDefault(d => d.Id == detailId)
                ?? throw new NotFoundException("Detalle de venta no encontrado con ID: " + detailId);
            sale.Details.Remove(existing);
            _db.SaleDetails.Remove(existing);
            sale.Details.AddRange(await MapDetailsAsync(sale, sale.BranchId, request, new Dictionary<long, decimal>(), ct));
            RecalculateTotals(sale);
            Touch(sale);
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(sale.Id, ct);
        }, ct);

    public Task DeleteDetailAsync(long id, long detailId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Sale sale = await GetDraftAsync(id, ct);
            SaleDetail detail = sale.Details.FirstOrDefault(d => d.Id == detailId)
                ?? throw new NotFoundException("Detalle de venta no encontrado");
            sale.Details.Remove(detail);
            _db.SaleDetails.Remove(detail);
            RecalculateTotals(sale);
            Touch(sale);
            await _db.SaveChangesAsync(ct);
        }, ct);

    public Task<SaleResponse> AddPaymentAsync(long id, SalePaymentRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Sale sale = await GetDraftAsync(id, ct);
            sale.Payments.Add(await MapPaymentAsync(sale, sale.BranchId, request, ct));
            Touch(sale);
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(sale.Id, ct);
        }, ct);

    public Task<SaleResponse> UpdatePaymentAsync(long id, long paymentId, SalePaymentRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Sale sale = await GetDraftAsync(id, ct);
            SalePayment payment = sale.Payments.FirstOrDefault(p => p.Id == paymentId) ?? throw new NotFoundException("Pago no encontrado");
            payment.AmountPaid = Money(request.Amount!.Value);
            payment.PaymentMethod = request.Method!.Value;
            payment.PaidAt = request.PaidAt ?? _clock.Now;
            payment.PaymentReference = request.Reference;
            payment.Notes = request.Notes;
            Touch(sale);
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(sale.Id, ct);
        }, ct);

    public Task DeletePaymentAsync(long id, long paymentId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Sale sale = await GetDraftAsync(id, ct);
            SalePayment payment = sale.Payments.FirstOrDefault(p => p.Id == paymentId) ?? throw new NotFoundException("Pago no encontrado");
            sale.Payments.Remove(payment);
            _db.SalePayments.Remove(payment);
            Touch(sale);
            await _db.SaveChangesAsync(ct);
        }, ct);

    public Task<SaleResponse> FinalizeAsync(long id, FinalizeSaleRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Sale sale = await GetDraftAsync(id, ct);
            if (sale.Details.Count == 0) throw new BadRequestException("No se puede finalizar una venta sin ítems");
            foreach (SalePaymentRequest payment in request.Payments ?? new())
                sale.Payments.Add(await MapPaymentAsync(sale, sale.BranchId, payment, ct));

            decimal paid = sale.Payments.Sum(p => p.AmountPaid);
            if (paid < sale.GrandTotal)
                throw new BadRequestException($"El total pagado ({paid}) es menor al total de la venta ({sale.GrandTotal})");

            // Revalida el stock de cada lote del borrador (pudo venderse en otra venta desde que se armó).
            var reserved = new Dictionary<long, decimal>();
            foreach (SaleDetail detail in sale.Details.Where(d => d.ProductId is not null))
            {
                decimal factor = (decimal)detail.SaleMode!.QuantityEquivalent;
                decimal needed = detail.Quantity * factor;
                decimal stock = (await _kardex.GetStockForProductByBatchAsync(detail.ProductId!.Value, sale.BranchId, ct))
                    .GetValueOrDefault(detail.ProductBatchId!.Value);
                decimal available = stock - reserved.GetValueOrDefault(detail.ProductBatchId!.Value);
                if (available < needed)
                    throw new InsufficientStockException(
                        $"Stock insuficiente para {detail.Product!.Name} (Lote: {detail.ProductBatch!.BatchNumber}). " +
                        $"Se intentan vender {detail.Quantity} {detail.UnitType} pero solo hay " +
                        $"{Math.Round(available / factor, 3, MidpointRounding.AwayFromZero)} disponibles.");
                reserved[detail.ProductBatchId!.Value] = reserved.GetValueOrDefault(detail.ProductBatchId!.Value) + needed;
            }

            SettleChange(sale);
            sale.Status = SaleStatus.COMPLETED;
            Touch(sale);
            await _db.SaveChangesAsync(ct);
            await ApplyCompletionEffectsAsync(sale, ct);
            return await ReloadAsync(sale.Id, ct);
        }, ct);

    /// <summary>Al completarse: salida de stock por cada línea de producto y servicios marcados como facturados.</summary>
    private async Task ApplyCompletionEffectsAsync(Sale sale, CancellationToken ct)
    {
        foreach (SaleDetail detail in sale.Details.Where(d => d.ProductId is not null))
            await _kardex.RegisterMovementAsync(new KardexRegistration(detail.ProductId!.Value, sale.BranchId, detail.ProductBatchId,
                detail.Quantity, detail.UnitType, KardexMovementType.SALE_EXIT, detail.Id, SaleDetailOrigin), ct);
        foreach (SaleDetail detail in sale.Details.Where(d => d.ServiceType is not null && d.ServiceItemId is not null))
            await _billables.MarkAsBilledAsync(detail.ServiceType!.Value, detail.ServiceItemId!.Value, detail.Id, ct);
    }

    // ---- Reglas de cálculo ----

    private static void RecalculateTotals(Sale sale)
    {
        sale.Subtotal = Money(sale.Details.Sum(d => d.LineSubtotal));
        sale.TaxTotal = Money(sale.Details.Sum(d => d.TaxAmount ?? 0m));
        sale.GrandTotal = Money(sale.Subtotal + sale.TaxTotal);
    }

    private static decimal Tax(decimal lineSubtotal, decimal? taxRate, decimal? taxAmount) =>
        taxAmount is null ? Money(lineSubtotal * (taxRate ?? 0m)) : Money(taxAmount.Value);

    /// <summary>
    /// Si se pagó de más, el vuelto se descuenta de los pagos en efectivo (del último al primero) y queda anotado en el pago.
    /// Sin efectivo suficiente para dar vuelto, la venta se rechaza.
    /// </summary>
    private static void SettleChange(Sale sale)
    {
        decimal change = Money(sale.Payments.Sum(p => p.AmountPaid) - sale.GrandTotal);
        if (change <= 0) return;
        List<SalePayment> cash = sale.Payments.Where(p => p.PaymentMethod == PaymentMethod.CASH).ToList();
        if (cash.Sum(p => p.AmountPaid) <= change)
            throw new BadRequestException($"El pago excede el total en {change:0.00} y ese vuelto no puede entregarse en efectivo: ajusta los montos pagados");

        decimal remaining = change;
        for (int i = cash.Count - 1; i >= 0 && remaining > 0; i--)
        {
            SalePayment payment = cash[i];
            decimal cut = Math.Min(Math.Max(payment.AmountPaid - 0.01m, 0m), remaining);
            if (cut <= 0) continue;
            payment.AmountPaid = Money(payment.AmountPaid - cut);
            string note = $"Vuelto entregado: {cut:0.00}";
            payment.Notes = string.IsNullOrWhiteSpace(payment.Notes) ? note : payment.Notes + " | " + note;
            remaining -= cut;
        }
        if (remaining > 0) throw new BadRequestException("No se pudo calcular el vuelto con los pagos en efectivo registrados");
    }

    private async Task<SalePayment> MapPaymentAsync(Sale sale, long branchId, SalePaymentRequest request, CancellationToken ct)
    {
        CashSession session = await _db.CashSessions
                                  .Where(c => c.BranchId == branchId && c.Status == CashSessionStatus.OPEN)
                                  .OrderByDescending(c => c.OpenedAt).FirstOrDefaultAsync(ct)
                              ?? throw new BadRequestException("No existe una caja abierta para registrar pagos en esta sucursal.");
        return new SalePayment
        {
            Sale = sale,
            AmountPaid = Money(request.Amount!.Value),
            PaymentMethod = request.Method!.Value,
            PaidAt = request.PaidAt ?? _clock.Now,
            PaymentReference = request.Reference,
            Notes = request.Notes,
            CashSession = session,
        };
    }

    private Task<List<SaleDetail>> MapDetailsAsync(Sale sale, long branchId, SaleItemRequest item,
        Dictionary<long, decimal> reservedByBatch, CancellationToken ct) => item.Kind switch
    {
        SaleItemKind.SERVICE => MapServiceDetailAsync(sale, branchId, item, ct),
        SaleItemKind.PRODUCT => MapProductDetailsAsync(sale, branchId, item, reservedByBatch, ct),
        _ => throw new BadRequestException("Tipo de ítem de venta no soportado"),
    };

    /// <summary>Reparte la cantidad entre los lotes vigentes, del que vence antes al que vence después (FEFO): una línea por lote.</summary>
    private async Task<List<SaleDetail>> MapProductDetailsAsync(Sale sale, long branchId, SaleItemRequest item,
        Dictionary<long, decimal> reservedByBatch, CancellationToken ct)
    {
        Product product = await _db.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId, ct)
            ?? throw new NotFoundException("Producto no encontrado");
        ProductSaleMode mode = await _db.ProductSaleModes.FirstOrDefaultAsync(m => m.Id == item.SaleModeId, ct)
            ?? throw new BadRequestException("Modo de venta no encontrado");
        if (mode.ProductId != product.Id) throw new BadRequestException("El modo de venta no pertenece al producto seleccionado");

        ProductUnitType unitType = mode.UnitType;
        decimal needed = Qty(item.Quantity!.Value);
        decimal unitPrice = Money(item.UnitPrice!.Value);
        decimal factor = (decimal)mode.QuantityEquivalent;
        if (factor <= 0) throw new BadRequestException("El modo de venta tiene un factor de equivalencia inválido.");
        decimal toFulfillBase = needed * factor;

        DateOnly today = _clock.Today;
        List<ProductBatch> batches = await _db.ProductBatches
            .Where(b => b.ProductId == product.Id && b.ExpirationDate >= today)
            .OrderBy(b => b.ExpirationDate).ToListAsync(ct);
        if (batches.Count == 0)
            throw new BadRequestException("No se encontraron lotes disponibles (no expirados) para el producto: " + product.Name);
        Dictionary<long, decimal> stock = await _kardex.GetStockForProductByBatchAsync(product.Id, branchId, ct);

        var details = new List<SaleDetail>();
        foreach (ProductBatch batch in batches)
        {
            if (toFulfillBase <= 0) break;
            decimal reserved = reservedByBatch.GetValueOrDefault(batch.Id);
            decimal available = stock.GetValueOrDefault(batch.Id) - reserved;
            if (available <= 0) continue;
            decimal takeBase = Math.Min(available, toFulfillBase);
            decimal takeUnits = Math.Round(takeBase / factor, 3, MidpointRounding.AwayFromZero);
            if (takeUnits <= 0) continue;

            decimal lineSubtotal = Money(unitPrice * takeUnits);
            details.Add(new SaleDetail
            {
                Sale = sale,
                ItemDescription = item.DescriptionOverride ?? $"{product.Name} - {unitType} (Lote: {batch.BatchNumber})",
                UnitPrice = unitPrice,
                Quantity = takeUnits,
                LineSubtotal = lineSubtotal,
                TaxRate = item.TaxRate ?? 0m,
                TaxAmount = Tax(lineSubtotal, item.TaxRate, item.TaxAmount),
                MetadataJson = item.MetadataJson,
                Product = product,
                ProductBatch = batch,
                SaleMode = mode,
                UnitType = unitType,
            });
            toFulfillBase -= takeBase;
            reservedByBatch[batch.Id] = reserved + takeBase;
        }

        if (toFulfillBase > 0)
        {
            decimal fulfilled = needed - Math.Round(toFulfillBase / factor, 3, MidpointRounding.AwayFromZero);
            throw new InsufficientStockException(
                $"Stock insuficiente para {product.Name}. Se pidieron {needed} {unitType} pero solo hay {fulfilled} disponibles.");
        }
        return details;
    }

    private async Task<List<SaleDetail>> MapServiceDetailAsync(Sale sale, long branchId, SaleItemRequest item, CancellationToken ct)
    {
        if (item.ServiceType is null || item.ServiceItemId is null)
            throw new BadRequestException("Debe indicar el tipo e identificador del servicio facturable");
        BillableServiceItem billable = await _billables.FetchItemAsync(item.ServiceType.Value, item.ServiceItemId.Value, ct);
        decimal quantity = Qty(billable.Quantity ?? item.Quantity!.Value);
        decimal unitPrice = Money(billable.UnitPrice ?? item.UnitPrice!.Value);
        decimal lineSubtotal = Money(unitPrice * quantity);
        if (billable.BranchId is not null && billable.BranchId != branchId)
            throw new BadRequestException("El servicio seleccionado pertenece a otra sucursal");
        string? description = string.IsNullOrWhiteSpace(item.DescriptionOverride) ? billable.Description : item.DescriptionOverride;
        if (string.IsNullOrWhiteSpace(description)) throw new BadRequestException("El ítem de venta requiere una descripción");

        return new List<SaleDetail>
        {
            new()
            {
                Sale = sale,
                ItemDescription = description,
                UnitPrice = unitPrice,
                Quantity = quantity,
                LineSubtotal = lineSubtotal,
                TaxRate = item.TaxRate ?? 0m,
                TaxAmount = Tax(lineSubtotal, item.TaxRate, item.TaxAmount),
                MetadataJson = item.MetadataJson,
                ServiceType = item.ServiceType,
                ServiceItemId = item.ServiceItemId,
            },
        };
    }
}
