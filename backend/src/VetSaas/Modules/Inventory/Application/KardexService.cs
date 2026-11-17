using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Inventory.Application;

/// <summary>Conversión entre unidades físicas (peso y volumen) respecto de la unidad base de un producto.</summary>
public static class UnitConversion
{
    private static readonly Dictionary<ProductUnitType, Dictionary<ProductUnitType, double>> FactorsToBase = new()
    {
        [ProductUnitType.KILOGRAM] = new() { [ProductUnitType.GRAM] = 1000.0, [ProductUnitType.MILLIGRAM] = 1_000_000.0, [ProductUnitType.MICROGRAM] = 1_000_000_000.0 },
        [ProductUnitType.GRAM] = new() { [ProductUnitType.MILLIGRAM] = 1000.0, [ProductUnitType.MICROGRAM] = 1_000_000.0, [ProductUnitType.KILOGRAM] = 0.001 },
        [ProductUnitType.MILLIGRAM] = new() { [ProductUnitType.MICROGRAM] = 1000.0, [ProductUnitType.GRAM] = 0.001, [ProductUnitType.KILOGRAM] = 0.000001 },
        [ProductUnitType.MICROGRAM] = new() { [ProductUnitType.MILLIGRAM] = 0.001, [ProductUnitType.GRAM] = 0.000001, [ProductUnitType.KILOGRAM] = 0.000000001 },
        [ProductUnitType.LITER] = new() { [ProductUnitType.MILLILITER] = 1000.0 },
        [ProductUnitType.MILLILITER] = new() { [ProductUnitType.LITER] = 0.001 },
    };

    /// <summary>Cuántas unidades base equivale 1 de cada unidad física compatible.</summary>
    public static Dictionary<ProductUnitType, double> EquivalentsFor(ProductUnitType baseUnit)
    {
        var equivalents = new Dictionary<ProductUnitType, double> { [baseUnit] = 1.0 };
        if (FactorsToBase.TryGetValue(baseUnit, out var fromBase))
            foreach ((ProductUnitType target, double factor) in fromBase)
                equivalents.TryAdd(target, 1.0 / factor);
        foreach ((ProductUnitType from, var conversions) in FactorsToBase)
            if (!equivalents.ContainsKey(from) && conversions.TryGetValue(baseUnit, out double toBase))
                equivalents[from] = toBase;
        return equivalents;
    }

    public static decimal ConvertFromBase(decimal quantityInBase, ProductUnitType baseUnit, ProductUnitType modeUnit)
    {
        if (baseUnit == modeUnit) return quantityInBase;
        if (!EquivalentsFor(baseUnit).TryGetValue(modeUnit, out double factor) || factor == 0.0) return quantityInBase;
        return Math.Round(quantityInBase / (decimal)factor, 6, MidpointRounding.AwayFromZero);
    }
}

public sealed record KardexRegistration(
    long ProductId,
    long BranchId,
    long? BatchId,
    decimal Quantity,
    ProductUnitType? UnitType,
    KardexMovementType Type,
    long OriginId,
    string OriginType);

public interface IKardexService
{
    /// <summary>Registra un movimiento validando lote, sucursal habilitada y que el stock del lote no quede negativo.</summary>
    Task RegisterMovementAsync(KardexRegistration request, CancellationToken ct = default);
    Task<decimal> GetCurrentStockAsync(long productId, long branchId, CancellationToken ct = default);
    Task<decimal> ConvertToBaseUnitAsync(long productId, decimal quantity, ProductUnitType? unitType, CancellationToken ct = default);
    Task<Dictionary<long, decimal>> GetStockForProductsAsync(IReadOnlyCollection<long> productIds, long? branchId, CancellationToken ct = default);
    Task<Dictionary<long, Dictionary<long, decimal>>> GetAggregatedBranchStockAsync(IReadOnlyCollection<long> productIds, CancellationToken ct = default);
    Task<Dictionary<long, decimal>> GetStockForProductByBatchAsync(long productId, long branchId, CancellationToken ct = default);
}

public sealed class KardexService : IKardexService
{
    private readonly TenantDbContext _db;
    private readonly IClock _clock;

    public KardexService(TenantDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    public Task RegisterMovementAsync(KardexRegistration request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            if (request.BatchId is null)
                throw new BadRequestException("El movimiento de inventario requiere un lote");
            if (request.Quantity <= 0)
                throw new BadRequestException("La cantidad del movimiento de inventario debe ser mayor a cero");

            Product product = await _db.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId, ct)
                ?? throw new NotFoundException("Producto no encontrado para Kardex");
            decimal baseQuantity = await ConvertToBaseUnitAsync(product, request.Quantity, request.UnitType, ct);
            if (request.Type.IsExit()) baseQuantity = -baseQuantity;

            // La fila producto-sucursal se bloquea hasta el fin de la transacción: los movimientos del mismo
            // producto en la misma sucursal se ejecutan uno tras otro y el stock nunca queda negativo por una carrera.
            List<ProductBranch> locked = await _db.ProductBranches
                .FromSqlInterpolated($"SELECT * FROM product_branch WHERE product_id = {request.ProductId} AND branch_id = {request.BranchId} FOR UPDATE")
                .AsNoTracking()
                .ToListAsync(ct);
            ProductBranch link = locked.FirstOrDefault()
                ?? throw new BadRequestException("Producto no configurado en la sucursal");
            if (!link.IsActive) throw new BadRequestException("El producto no está activo en esta sucursal");

            decimal currentStock = await _db.KardexMovements
                .Where(k => k.ProductId == request.ProductId && k.BranchId == request.BranchId && k.BatchId == request.BatchId)
                .SumAsync(k => (decimal?)k.Quantity, ct) ?? 0m;
            decimal resultingStock = currentStock + baseQuantity;
            if (resultingStock < 0)
                throw new InsufficientStockException("Stock insuficiente para el producto: " + product.Name);

            _db.KardexMovements.Add(new KardexMovement
            {
                ProductId = product.Id,
                BranchId = request.BranchId,
                BatchId = request.BatchId.Value,
                Date = _clock.Now,
                Type = request.Type,
                Quantity = baseQuantity,
                ResultingStock = resultingStock,
                OriginId = request.OriginId,
                OriginType = request.OriginType,
            });
            await _db.SaveChangesAsync(ct);
        }, ct);

    public async Task<decimal> GetCurrentStockAsync(long productId, long branchId, CancellationToken ct = default) =>
        await _db.KardexMovements.Where(k => k.ProductId == productId && k.BranchId == branchId)
            .SumAsync(k => (decimal?)k.Quantity, ct) ?? 0m;

    public async Task<decimal> ConvertToBaseUnitAsync(long productId, decimal quantity, ProductUnitType? unitType,
        CancellationToken ct = default)
    {
        Product product = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productId, ct)
            ?? throw new NotFoundException("Producto no encontrado para conversión de unidades");
        return await ConvertToBaseUnitAsync(product, quantity, unitType, ct);
    }

    private async Task<decimal> ConvertToBaseUnitAsync(Product product, decimal quantity, ProductUnitType? unitType,
        CancellationToken ct)
    {
        if (unitType is null || unitType == product.UnitType) return quantity;
        if (unitType.Value.IsFractionable())
        {
            if (!UnitConversion.EquivalentsFor(product.UnitType).TryGetValue(unitType.Value, out double factor))
                throw new BadRequestException($"No se encontró un factor de conversión física de {unitType} a {product.UnitType}");
            return quantity * (decimal)factor;
        }
        ProductSaleMode mode = await _db.ProductSaleModes.AsNoTracking()
                                   .FirstOrDefaultAsync(m => m.ProductId == product.Id && m.UnitType == unitType, ct)
                               ?? throw new BadRequestException($"Modo de venta no válido '{unitType}' para el producto '{product.Name}'");
        return quantity * (decimal)mode.QuantityEquivalent;
    }

    public async Task<Dictionary<long, decimal>> GetStockForProductsAsync(IReadOnlyCollection<long> productIds, long? branchId,
        CancellationToken ct = default)
    {
        IQueryable<KardexMovement> query = _db.KardexMovements.Where(k => productIds.Contains(k.ProductId));
        if (branchId is not null) query = query.Where(k => k.BranchId == branchId);
        return await query.GroupBy(k => k.ProductId)
            .Select(g => new { g.Key, Total = g.Sum(k => k.Quantity) })
            .ToDictionaryAsync(x => x.Key, x => x.Total, ct);
    }

    public async Task<Dictionary<long, Dictionary<long, decimal>>> GetAggregatedBranchStockAsync(
        IReadOnlyCollection<long> productIds, CancellationToken ct = default)
    {
        var rows = await _db.KardexMovements.Where(k => productIds.Contains(k.ProductId))
            .GroupBy(k => new { k.ProductId, k.BranchId })
            .Select(g => new { g.Key.ProductId, g.Key.BranchId, Total = g.Sum(k => k.Quantity) })
            .ToListAsync(ct);
        return rows.GroupBy(r => r.ProductId)
            .ToDictionary(g => g.Key, g => g.ToDictionary(r => r.BranchId, r => r.Total));
    }

    public async Task<Dictionary<long, decimal>> GetStockForProductByBatchAsync(long productId, long branchId,
        CancellationToken ct = default) =>
        await _db.KardexMovements.Where(k => k.ProductId == productId && k.BranchId == branchId)
            .GroupBy(k => k.BatchId)
            .Select(g => new { g.Key, Total = g.Sum(k => k.Quantity) })
            .ToDictionaryAsync(x => x.Key, x => x.Total, ct);
}

/// <summary>
/// Consumo de inventario por servicios (hospitalización, procedimientos): descuenta por lotes respetando el vencimiento
/// (FEFO), reparte entre lotes si hace falta y falla de forma explícita sin stock suficiente. También devuelve lo consumido.
/// </summary>
public interface IInventoryConsumptionService
{
    Task ConsumeAsync(long productId, long? branchId, decimal? quantity, ProductUnitType? unit, string originType, long originId,
        CancellationToken ct = default);
    /// <summary>Devuelve lo que aún esté consumido para ese origen (consumos menos devoluciones previas): es idempotente.</summary>
    Task RestoreAsync(string originType, long originId, CancellationToken ct = default);
}

public sealed class InventoryConsumptionService : IInventoryConsumptionService
{
    private const string ReturnSuffix = "_RETURN";
    private readonly TenantDbContext _db;
    private readonly IKardexService _kardex;
    private readonly IClock _clock;

    public InventoryConsumptionService(TenantDbContext db, IKardexService kardex, IClock clock)
    {
        _db = db;
        _kardex = kardex;
        _clock = clock;
    }

    public Task ConsumeAsync(long productId, long? branchId, decimal? quantity, ProductUnitType? unit, string originType,
        long originId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            if (branchId is null) throw new BadRequestException("No se puede descontar inventario sin sucursal");
            if (quantity is null || quantity <= 0) throw new BadRequestException("La cantidad a consumir debe ser mayor a cero");

            decimal remaining = await _kardex.ConvertToBaseUnitAsync(productId, quantity.Value, unit, ct);
            Dictionary<long, decimal> stockByBatch = await _kardex.GetStockForProductByBatchAsync(productId, branchId.Value, ct);
            DateOnly today = _clock.Today;
            List<ProductBatch> batches = await _db.ProductBatches.AsNoTracking()
                .Where(b => b.ProductId == productId && b.ExpirationDate >= today)
                .OrderBy(b => b.ExpirationDate)
                .ToListAsync(ct);

            decimal available = batches.Sum(b => Math.Max(stockByBatch.GetValueOrDefault(b.Id), 0m));
            if (available < remaining)
                throw new InsufficientStockException(
                    $"Stock insuficiente (lotes vigentes) para el producto #{productId}: se necesitan {remaining} y hay {available}");

            foreach (ProductBatch batch in batches)
            {
                if (remaining <= 0) break;
                decimal inBatch = stockByBatch.GetValueOrDefault(batch.Id);
                if (inBatch <= 0) continue;
                decimal take = Math.Min(inBatch, remaining);
                await _kardex.RegisterMovementAsync(new KardexRegistration(productId, branchId.Value, batch.Id, take, null,
                    KardexMovementType.SERVICE_EXIT, originId, originType), ct);
                remaining -= take;
            }
        }, ct);

    public Task RestoreAsync(string originType, long originId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            string returnType = originType + ReturnSuffix;
            var balances = await _db.KardexMovements.AsNoTracking()
                .Where(k => (k.OriginType == originType || k.OriginType == returnType) && k.OriginId == originId)
                .GroupBy(k => new { k.ProductId, k.BranchId, k.BatchId })
                .Select(g => new { g.Key.ProductId, g.Key.BranchId, g.Key.BatchId, Net = g.Sum(k => k.Quantity) })
                .ToListAsync(ct);
            foreach (var balance in balances.Where(b => b.Net < 0))
                await _kardex.RegisterMovementAsync(new KardexRegistration(balance.ProductId, balance.BranchId, balance.BatchId,
                    -balance.Net, null, KardexMovementType.SERVICE_RETURN_ENTRY, originId, returnType), ct);
        }, ct);
}
