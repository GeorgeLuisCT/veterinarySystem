using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Employees.Application;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Inventory.Application;

/// <summary>
/// Cuenta por pagar de una compra de inventario (la implementa Finanzas). Se registra en la misma transacción que la compra.
/// </summary>
public interface IPurchasePayableRegistrar
{
    Task RegisterPurchasePayableAsync(long supplierId, string description, DateTime issueDate, decimal totalAmount,
        decimal? upfrontPayment, long? treasuryAccountId, string paymentDescription, CancellationToken ct = default);
}

// ---- Categorías ----

public interface ICategoryProductService
{
    Task<List<CategoryProductResponse>> GetAllAsync(CancellationToken ct = default);
    Task<CategoryProductResponse?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<CategoryProductResponse> SaveAsync(CategoryProductRequest request, CancellationToken ct = default);
    Task<CategoryProductResponse?> UpdateNameAsync(long id, string name, CancellationToken ct = default);
    Task<bool> SetActiveAsync(long id, bool active, CancellationToken ct = default);
    Task<bool> HardDeleteAsync(long id, CancellationToken ct = default);
}

public sealed class CategoryProductService : ICategoryProductService
{
    private readonly TenantDbContext _db;

    public CategoryProductService(TenantDbContext db) => _db = db;

    public async Task<List<CategoryProductResponse>> GetAllAsync(CancellationToken ct = default) =>
        (await _db.CategoryProducts.AsNoTracking().OrderBy(c => c.Id).ToListAsync(ct)).Select(CategoryProductResponse.From).ToList();

    public async Task<CategoryProductResponse?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        CategoryProduct? category = await _db.CategoryProducts.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        return category is null ? null : CategoryProductResponse.From(category);
    }

    public async Task<CategoryProductResponse> SaveAsync(CategoryProductRequest request, CancellationToken ct = default)
    {
        var category = new CategoryProduct { Name = request.Name!, IsActive = true };
        _db.CategoryProducts.Add(category);
        await _db.SaveChangesAsync(ct);
        return CategoryProductResponse.From(category);
    }

    public async Task<CategoryProductResponse?> UpdateNameAsync(long id, string name, CancellationToken ct = default)
    {
        CategoryProduct? category = await _db.CategoryProducts.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (category is null) return null;
        category.Name = name;
        await _db.SaveChangesAsync(ct);
        return CategoryProductResponse.From(category);
    }

    public async Task<bool> SetActiveAsync(long id, bool active, CancellationToken ct = default)
    {
        CategoryProduct? category = await _db.CategoryProducts.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (category is null) return false;
        category.IsActive = active;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> HardDeleteAsync(long id, CancellationToken ct = default)
    {
        CategoryProduct? category = await _db.CategoryProducts.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (category is null) return false;
        _db.CategoryProducts.Remove(category);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}

// ---- Proveedores ----

public interface ISupplierService
{
    Task<SupplierSummaryResponse> CreateAsync(SupplierCreateRequest request, CancellationToken ct = default);
    Task<SupplierResponse> GetAsync(long id, CancellationToken ct = default);
    Task<PaginatedResponse<SupplierSummaryResponse>> ListAsync(int page, int size, bool? active, string? supplierType, string? q, CancellationToken ct = default);
    Task<List<SupplierQuickSearchResponse>> QuickSearchAsync(string? query, CancellationToken ct = default);
    Task<SupplierSummaryResponse> UpdateAsync(SupplierUpdateRequest request, CancellationToken ct = default);
    Task<SupplierSummaryResponse> SetActiveAsync(long id, bool active, CancellationToken ct = default);
    Task HardDeleteAsync(long id, CancellationToken ct = default);
}

public sealed class SupplierService : ISupplierService
{
    private readonly TenantDbContext _db;

    public SupplierService(TenantDbContext db) => _db = db;

    private async Task<Supplier> RequireAsync(long id, CancellationToken ct) =>
        await _db.Suppliers.FirstOrDefaultAsync(s => s.Id == id, ct) ?? throw new NotFoundException("Proveedor no encontrado");

    private static void Apply(Supplier s, BaseSupplierRequest r)
    {
        s.Name = r.Name!;
        s.Ruc = r.Ruc;
        s.Address = r.Address;
        s.Website = r.Website;
        s.Phone = r.ContactPhone;
        s.Email = r.Email;
        s.SupplierType = r.SupplierType!.Value;
        s.BankAccountNumber = r.BankAccountNumber;
        s.BankName = r.BankName;
    }

    public async Task<SupplierSummaryResponse> CreateAsync(SupplierCreateRequest request, CancellationToken ct = default)
    {
        if (request.Email is not null && await _db.Suppliers.AnyAsync(s => s.Email == request.Email, ct))
            throw new BadRequestException("El correo electrónico ya está en uso");
        var supplier = new Supplier { Active = true };
        Apply(supplier, request);
        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync(ct);
        return SupplierSummaryResponse.From(supplier);
    }

    public async Task<SupplierResponse> GetAsync(long id, CancellationToken ct = default) =>
        SupplierResponse.From(await RequireAsync(id, ct));

    public async Task<PaginatedResponse<SupplierSummaryResponse>> ListAsync(int page, int size, bool? active,
        string? supplierType, string? q, CancellationToken ct = default)
    {
        IQueryable<Supplier> query = _db.Suppliers.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            string like = $"%{q.Trim()}%";
            query = query.Where(s => EF.Functions.ILike(s.Name, like) || EF.Functions.ILike(s.Ruc!, like) ||
                                     EF.Functions.ILike(s.Email!, like));
        }
        if (!string.IsNullOrWhiteSpace(supplierType))
        {
            // Un tipo desconocido no coincide con nada (como en el backend anterior).
            if (Enum.TryParse(supplierType.Trim().ToUpperInvariant(), out SupplierType type) && Enum.IsDefined(type))
                query = query.Where(s => s.SupplierType == type);
            else
                query = query.Where(_ => false);
        }
        if (active is not null) query = query.Where(s => s.Active == active);
        var result = await query.OrderBy(s => s.Name).ThenBy(s => s.Id).ToPageAsync(page, size, ct);
        return result.Map(SupplierSummaryResponse.From);
    }

    public async Task<List<SupplierQuickSearchResponse>> QuickSearchAsync(string? query, CancellationToken ct = default)
    {
        IQueryable<Supplier> suppliers = _db.Suppliers.AsNoTracking().Where(s => s.Active);
        if (!string.IsNullOrWhiteSpace(query))
        {
            string like = $"%{query.Trim()}%";
            suppliers = suppliers.Where(s => EF.Functions.ILike(s.Name, like) || EF.Functions.ILike(s.Ruc!, like) ||
                                             EF.Functions.ILike(s.Email!, like));
        }
        return await suppliers.OrderBy(s => s.Name).Take(10)
            .Select(s => new SupplierQuickSearchResponse(s.Id, s.Name, s.Email)).ToListAsync(ct);
    }

    public async Task<SupplierSummaryResponse> UpdateAsync(SupplierUpdateRequest request, CancellationToken ct = default)
    {
        Supplier supplier = await RequireAsync(request.Id!.Value, ct);
        if (request.Email is not null && await _db.Suppliers.AnyAsync(s => s.Email == request.Email && s.Id != supplier.Id, ct))
            throw new BadRequestException("El correo electrónico ya está en uso por otro proveedor");
        Apply(supplier, request);
        await _db.SaveChangesAsync(ct);
        return SupplierSummaryResponse.From(supplier);
    }

    public async Task<SupplierSummaryResponse> SetActiveAsync(long id, bool active, CancellationToken ct = default)
    {
        Supplier supplier = await RequireAsync(id, ct);
        supplier.Active = active;
        await _db.SaveChangesAsync(ct);
        return SupplierSummaryResponse.From(supplier);
    }

    public async Task HardDeleteAsync(long id, CancellationToken ct = default)
    {
        Supplier supplier = await RequireAsync(id, ct);
        _db.Suppliers.Remove(supplier);
        await _db.SaveChangesAsync(ct);
    }
}

// ---- Movimientos de inventario ----

public interface IInventoryMovementService
{
    Task<InventoryMovementResponse> CreatePurchaseAsync(PurchaseCreateRequest request, long employeeId, CancellationToken ct = default);
    Task<InventoryMovementResponse> CreateTransferAsync(TransferCreateRequest request, long employeeId, CancellationToken ct = default);
    Task<InventoryMovementResponse> CreateAdjustmentAsync(AdjustmentCreateRequest request, long employeeId, CancellationToken ct = default);
    Task<PaginatedResponse<InventoryMovementSummaryResponse>> ListAsync(int page, int size, long? branchId,
        IReadOnlyCollection<InventoryMovementType>? types, DateOnly? startDate, DateOnly? endDate, CancellationToken ct = default);
    Task<InventoryMovementResponse> GetAsync(long id, CancellationToken ct = default);
    Task<PaginatedResponse<KardexMovementResponse>> GetKardexHistoryAsync(int page, int size, long productId, long? branchId,
        long? batchId, DateOnly? startDate, DateOnly? endDate, CancellationToken ct = default);
    Task<List<ProductBatchSearchResponse>> SearchBatchesAsync(long productId, string? query, CancellationToken ct = default);
}

public sealed class InventoryMovementService : IInventoryMovementService
{
    private const string OriginType = "InventoryMovement";
    private readonly TenantDbContext _db;
    private readonly IKardexService _kardex;
    private readonly IPurchasePayableRegistrar _payables;
    private readonly IClock _clock;

    public InventoryMovementService(TenantDbContext db, IKardexService kardex, IPurchasePayableRegistrar payables, IClock clock)
    {
        _db = db;
        _kardex = kardex;
        _payables = payables;
        _clock = clock;
    }

    public Task<InventoryMovementResponse> CreatePurchaseAsync(PurchaseCreateRequest request, long employeeId,
        CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            var movement = new InventoryMovement
            {
                Type = InventoryMovementType.PURCHASE,
                Date = request.Date!.Value,
                SourceBranchId = request.BranchId!.Value,
                SupplierId = request.SupplierId!.Value,
                EmployeeId = employeeId,
                Description = request.Description,
            };
            foreach (PurchaseProductRequest p in request.Products!)
            {
                ProductBatch batch = await FindOrCreateBatchAsync(p.ProductId!.Value, p.BatchNumber!, p.ExpirationDate, ct);
                movement.Products.Add(new InventoryMovementProduct
                {
                    ProductId = p.ProductId!.Value, ProductBatch = batch, Quantity = p.Quantity!.Value,
                    UnitType = p.UnitType!.Value, UnitCost = p.UnitCost,
                });
            }
            _db.InventoryMovements.Add(movement);
            await _db.SaveChangesAsync(ct);

            foreach (InventoryMovementProduct p in movement.Products)
                await _kardex.RegisterMovementAsync(new KardexRegistration(p.ProductId, movement.SourceBranchId,
                    p.ProductBatchId, (decimal)p.Quantity, p.UnitType, KardexMovementType.PURCHASE_ENTRY, movement.Id, OriginType), ct);

            decimal total = Math.Round(request.Products!.Sum(p => p.UnitCost!.Value * (decimal)p.Quantity!.Value), 2,
                MidpointRounding.AwayFromZero);
            bool payNow = request.PayNow == true && request.PaymentAmount is > 0 && request.PaymentTreasuryAccountId is not null;
            await _payables.RegisterPurchasePayableAsync(
                request.SupplierId!.Value,
                request.Description ?? "Compra inventario #" + movement.Id,
                request.Date ?? _clock.Now,
                total,
                payNow ? request.PaymentAmount : null,
                payNow ? request.PaymentTreasuryAccountId : null,
                "Pago inicial compra #" + movement.Id, ct);

            return await GetAsync(movement.Id, ct);
        }, ct);

    public Task<InventoryMovementResponse> CreateTransferAsync(TransferCreateRequest request, long employeeId,
        CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            if (request.SourceBranchId == request.TargetBranchId)
                throw new BadRequestException("La sucursal de origen y destino no pueden ser la misma.");
            var movement = new InventoryMovement
            {
                Type = InventoryMovementType.TRANSFER,
                Date = _clock.Now,
                SourceBranchId = request.SourceBranchId!.Value,
                TargetBranchId = request.TargetBranchId!.Value,
                EmployeeId = employeeId,
                Description = request.Description,
                Products = request.Products!.Select(p => new InventoryMovementProduct
                {
                    ProductId = p.ProductId!.Value, ProductBatchId = p.BatchId, Quantity = p.Quantity!.Value, UnitType = p.UnitType!.Value,
                }).ToList(),
            };
            _db.InventoryMovements.Add(movement);
            await _db.SaveChangesAsync(ct);

            foreach (InventoryMovementProduct p in movement.Products)
            {
                decimal quantity = (decimal)p.Quantity;
                await _kardex.RegisterMovementAsync(new KardexRegistration(p.ProductId, movement.SourceBranchId, p.ProductBatchId,
                    quantity, p.UnitType, KardexMovementType.TRANSFER_EXIT, movement.Id, OriginType), ct);
                await _kardex.RegisterMovementAsync(new KardexRegistration(p.ProductId, movement.TargetBranchId!.Value, p.ProductBatchId,
                    quantity, p.UnitType, KardexMovementType.TRANSFER_ENTRY, movement.Id, OriginType), ct);
            }
            return await GetAsync(movement.Id, ct);
        }, ct);

    public Task<InventoryMovementResponse> CreateAdjustmentAsync(AdjustmentCreateRequest request, long employeeId,
        CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            var movement = new InventoryMovement
            {
                Type = InventoryMovementType.ADJUSTMENT,
                Date = _clock.Now,
                SourceBranchId = request.BranchId!.Value,
                EmployeeId = employeeId,
                Description = request.Description,
                Products = request.Products!.Select(p => new InventoryMovementProduct
                {
                    ProductId = p.ProductId!.Value, ProductBatchId = p.BatchId, Quantity = p.Quantity!.Value, UnitType = p.UnitType!.Value,
                }).ToList(),
            };
            _db.InventoryMovements.Add(movement);
            await _db.SaveChangesAsync(ct);

            for (int i = 0; i < movement.Products.Count; i++)
            {
                InventoryMovementProduct p = movement.Products[i];
                KardexMovementType type = request.Products![i].AdjustmentType == AdjustmentType.ENTRY
                    ? KardexMovementType.ADJUSTMENT_ENTRY
                    : KardexMovementType.ADJUSTMENT_EXIT;
                await _kardex.RegisterMovementAsync(new KardexRegistration(p.ProductId, movement.SourceBranchId, p.ProductBatchId,
                    (decimal)p.Quantity, p.UnitType, type, movement.Id, OriginType), ct);
            }
            return await GetAsync(movement.Id, ct);
        }, ct);

    private async Task<ProductBatch> FindOrCreateBatchAsync(long productId, string batchNumber, DateOnly? expiration,
        CancellationToken ct)
    {
        ProductBatch? batch = await _db.ProductBatches.FirstOrDefaultAsync(b => b.ProductId == productId && b.BatchNumber == batchNumber, ct)
                              ?? _db.ProductBatches.Local.FirstOrDefault(b => b.ProductId == productId && b.BatchNumber == batchNumber);
        if (batch is not null) return batch;
        batch = new ProductBatch { ProductId = productId, BatchNumber = batchNumber, ExpirationDate = expiration };
        _db.ProductBatches.Add(batch);
        return batch;
    }

    public async Task<PaginatedResponse<InventoryMovementSummaryResponse>> ListAsync(int page, int size, long? branchId,
        IReadOnlyCollection<InventoryMovementType>? types, DateOnly? startDate, DateOnly? endDate, CancellationToken ct = default)
    {
        IQueryable<InventoryMovement> query = _db.InventoryMovements.AsNoTracking();
        if (branchId is not null) query = query.Where(m => m.SourceBranchId == branchId || m.TargetBranchId == branchId);
        if (types is { Count: > 0 }) query = query.Where(m => types.Contains(m.Type));
        if (startDate is not null)
        {
            DateTime from = startDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(m => m.Date >= from);
        }
        if (endDate is not null)
        {
            DateTime to = endDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(m => m.Date < to);
        }
        return await query.OrderByDescending(m => m.Date).ThenByDescending(m => m.Id)
            .Select(m => new InventoryMovementSummaryResponse(m.Id, m.Type, m.Date, m.SourceBranch.Name,
                m.TargetBranch != null ? m.TargetBranch.Name : null,
                m.Supplier != null ? m.Supplier.Name : null,
                m.Employee.FirstName + " " + m.Employee.LastName, m.Description))
            .ToPageAsync(page, size, ct);
    }

    public async Task<InventoryMovementResponse> GetAsync(long id, CancellationToken ct = default)
    {
        InventoryMovement m = await _db.InventoryMovements.AsNoTracking()
                                  .Include(x => x.SourceBranch).Include(x => x.TargetBranch)
                                  .Include(x => x.Supplier).Include(x => x.Employee)
                                  .Include(x => x.Products).ThenInclude(p => p.Product)
                                  .Include(x => x.Products).ThenInclude(p => p.ProductBatch)
                                  .AsSplitQuery()
                                  .FirstOrDefaultAsync(x => x.Id == id, ct)
                              ?? throw new NotFoundException("Movimiento no encontrado: " + id);
        Employee e = m.Employee;
        return new InventoryMovementResponse(m.Id, m.Type, m.Date,
            new BranchSummaryResponse(m.SourceBranch.Id, m.SourceBranch.Name),
            m.TargetBranch is null ? null : new BranchSummaryResponse(m.TargetBranch.Id, m.TargetBranch.Name),
            m.Supplier is null ? null : SupplierSummaryResponse.Minimal(m.Supplier),
            new EmployeeSummaryResponse(e.Id, e.FirstName + " " + e.LastName, null!, null!, null, null!, null!, false),
            m.Description,
            m.Products.OrderBy(p => p.Id).Select(p => new InventoryMovementProductResponse(p.Id, ProductSummaryResponse.Minimal(p.Product),
                p.ProductBatch is null ? null : new ProductBatchSummaryResponse(p.ProductBatch.Id, p.ProductBatch.BatchNumber, p.ProductBatch.ExpirationDate),
                p.Quantity, p.UnitType, p.UnitCost)).ToList());
    }

    public async Task<PaginatedResponse<KardexMovementResponse>> GetKardexHistoryAsync(int page, int size, long productId,
        long? branchId, long? batchId, DateOnly? startDate, DateOnly? endDate, CancellationToken ct = default)
    {
        IQueryable<KardexMovement> query = _db.KardexMovements.AsNoTracking().Where(k => k.ProductId == productId);
        if (branchId is > 0) query = query.Where(k => k.BranchId == branchId);
        if (batchId is not null) query = query.Where(k => k.BatchId == batchId);
        if (startDate is not null)
        {
            DateTime from = startDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(k => k.Date >= from);
        }
        if (endDate is not null)
        {
            DateTime to = endDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(k => k.Date < to);
        }
        return await query.OrderByDescending(k => k.Date).ThenByDescending(k => k.Id)
            .Select(k => new KardexMovementResponse(k.Id, k.Date, k.Type, k.Quantity, k.ResultingStock, k.OriginId,
                k.OriginType, k.Product.Name, k.Batch.BatchNumber, k.Batch.ExpirationDate))
            .ToPageAsync(page, size, ct);
    }

    public async Task<List<ProductBatchSearchResponse>> SearchBatchesAsync(long productId, string? query, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query)) return new List<ProductBatchSearchResponse>();
        string like = $"%{query}%";
        return await _db.ProductBatches.AsNoTracking()
            .Where(b => b.ProductId == productId && EF.Functions.ILike(b.BatchNumber, like))
            .OrderBy(b => b.Id).Take(20)
            .Select(b => new ProductBatchSearchResponse(b.Id, b.BatchNumber, b.ProductId, b.ExpirationDate))
            .ToListAsync(ct);
    }
}
