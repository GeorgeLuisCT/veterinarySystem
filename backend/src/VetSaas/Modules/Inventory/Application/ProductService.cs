using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;

namespace VetSaas.Modules.Inventory.Application;

public interface IProductService
{
    Task<ProductSummaryResponse> CreateAsync(ProductCreateRequest request, CancellationToken ct = default);
    Task<ProductResponse> GetAsync(long id, CancellationToken ct = default);
    Task<List<ProductResponse>> GetManyAsync(List<long>? ids, CancellationToken ct = default);
    Task<PaginatedResponse<ProductSummaryResponse>> ListAsync(ProductListFilter filter, CancellationToken ct = default);
    Task<List<ProductQuickSearchResponse>> QuickSearchAsync(string? name, long? branchId, CancellationToken ct = default);
    Task<ProductSummaryResponse> UpdateAsync(ProductUpdateRequest request, CancellationToken ct = default);
    Task SoftDeleteAsync(long id, long? branchId, CancellationToken ct = default);
    Task HardDeleteAsync(long id, CancellationToken ct = default);
    Task<ProductSummaryResponse> RestoreAsync(long id, long? branchId, CancellationToken ct = default);
}

public sealed record ProductListFilter(int Page, int Size, string? Q, long? CategoryId, long? BranchId, bool? Active,
    string? Presentation, ProductUnitType? UnitType, string? Route, bool? HasSaleModes,
    bool? AvailableOnly, bool? MinStockAlertOnly);

public sealed class ProductService : IProductService
{
    private readonly TenantDbContext _db;
    private readonly IKardexService _kardex;

    public ProductService(TenantDbContext db, IKardexService kardex)
    {
        _db = db;
        _kardex = kardex;
    }

    private IQueryable<Product> WithDetails() => _db.Products
        .Include(p => p.Category)
        .Include(p => p.SaleModes)
        .Include(p => p.AdministrationRoutes)
        .Include(p => p.BranchStocks).ThenInclude(b => b.Branch)
        .AsSplitQuery();

    // ---- Mapeo con stock ----

    private static (decimal Main, decimal Remainder) SplitStock(decimal totalBase, double contentTotal)
    {
        if (contentTotal <= 0) return (totalBase, 0m);
        decimal size = (decimal)contentTotal;
        return (Math.Floor(totalBase / size), totalBase % size);
    }

    internal static SaleModeSummary ToSaleModeSummary(ProductSaleMode mode, Product product)
    {
        decimal absolute = (decimal)mode.QuantityEquivalent;
        decimal relative;
        if (mode.UnitType.IsFractionable())
            relative = UnitConversion.ConvertFromBase(absolute, product.UnitType, mode.UnitType);
        else
        {
            decimal baseEquivalence = (decimal)product.ContentTotal;
            relative = baseEquivalence == 0 ? 0 : Math.Round(absolute / baseEquivalence, 6, MidpointRounding.AwayFromZero);
        }
        return new SaleModeSummary(mode.Id, mode.UnitType, relative, mode.Price, mode.IsBaseMode);
    }

    private static List<BranchStockSummary> BranchStocks(Product p, IReadOnlyDictionary<long, decimal>? branchStock) =>
        p.BranchStocks.OrderBy(s => s.Branch.Name, StringComparer.OrdinalIgnoreCase)
            .Select(s =>
            {
                (decimal main, decimal remainder) = SplitStock(branchStock?.GetValueOrDefault(s.BranchId) ?? 0m, p.ContentTotal);
                return new BranchStockSummary(s.BranchId, s.Branch.Name, s.IsActive, main, remainder);
            }).ToList();

    private static decimal BasePrice(Product p) => p.SaleModes.FirstOrDefault(m => m.IsBaseMode)?.Price ?? 0m;

    private static (bool Below, bool Available) Flags(Product p, decimal stockBase) =>
        (stockBase < p.MinStock * (decimal)p.ContentTotal, stockBase > 0);

    internal static ProductResponse ToResponse(Product p, decimal stockBase, IReadOnlyDictionary<long, decimal>? branchStock)
    {
        (decimal main, decimal remainder) = SplitStock(stockBase, p.ContentTotal);
        (bool below, bool available) = Flags(p, stockBase);
        return new ProductResponse(p.Id, p.Name, CategoryProductResponse.From(p.Category), p.Description, p.MinStock, p.Sku,
            p.Presentation, p.UnitType, p.ContentTotal, BasePrice(p), p.Routes.ToList(),
            p.SaleModes.OrderBy(m => m.UnitType).Select(m => ToSaleModeSummary(m, p)).ToList(),
            BranchStocks(p, branchStock), main, remainder, below, available);
    }

    internal static ProductSummaryResponse ToSummary(Product p, decimal stockBase, IReadOnlyDictionary<long, decimal>? branchStock)
    {
        (decimal main, decimal remainder) = SplitStock(stockBase, p.ContentTotal);
        (bool below, bool available) = Flags(p, stockBase);
        return new ProductSummaryResponse(p.Id, p.Name, p.Category?.Name, p.Description, p.MinStock, p.Sku, p.Presentation,
            p.UnitType, p.ContentTotal, BasePrice(p), p.Routes.ToList(),
            p.SaleModes.Where(m => !m.IsBaseMode).OrderBy(m => m.UnitType).Select(m => ToSaleModeSummary(m, p)).ToList(),
            BranchStocks(p, branchStock), main, remainder, below, available);
    }

    private async Task<ProductSummaryResponse> SummaryWithStockAsync(Product product, CancellationToken ct)
    {
        long[] ids = { product.Id };
        decimal total = (await _kardex.GetStockForProductsAsync(ids, null, ct)).GetValueOrDefault(product.Id);
        var byBranch = (await _kardex.GetAggregatedBranchStockAsync(ids, ct)).GetValueOrDefault(product.Id);
        return ToSummary(product, total, byBranch);
    }

    // ---- Operaciones ----

    public Task<ProductSummaryResponse> CreateAsync(ProductCreateRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            if (await _db.Products.AnyAsync(p => p.Sku == request.Sku, ct))
                throw new BadRequestException("El SKU ya está en uso");
            CategoryProduct category = await _db.CategoryProducts.FirstOrDefaultAsync(c => c.Id == request.CategoryId, ct)
                ?? throw new NotFoundException("Categoría no encontrada");

            var product = new Product
            {
                Name = request.Name!,
                Description = request.Description!,
                MinStock = request.MinStock!.Value,
                Category = category,
                Sku = request.Sku!,
                Presentation = request.Presentation!,
                UnitType = request.BaseUnitType!.Value,
                ContentTotal = request.ContentTotal!.Value,
            };
            foreach (string route in request.AdministrationRoutes ?? new())
                product.AdministrationRoutes.Add(new ProductAdministrationRoute { Route = route });

            // El producto queda enlazado a todas las sucursales; solo las elegidas quedan activas.
            foreach (Branch branch in await _db.Branches.ToListAsync(ct))
                product.BranchStocks.Add(new ProductBranch
                {
                    Branch = branch, Product = product, IsActive = request.BranchIds!.Contains(branch.Id),
                });

            foreach (ProductSaleMode mode in BuildInitialSaleModes(product, request))
                product.SaleModes.Add(mode);

            _db.Products.Add(product);
            await _db.SaveChangesAsync(ct);
            return ToSummary(product, 0m, null);
        }, ct);

    private static void EnsureUnitContent(ProductUnitType baseUnit, ProductUnitType? mainUnit, double? contentTotal)
    {
        if (baseUnit == ProductUnitType.UNIT && mainUnit == ProductUnitType.UNIT && contentTotal != 1.0)
            throw new BadRequestException("Si la unidad base y la unidad de venta principal son 'UNIDAD', " +
                                          "el contenido total (contentTotal) debe ser exactamente 1.0");
    }

    private static List<ProductSaleMode> BuildInitialSaleModes(Product product, ProductCreateRequest request)
    {
        EnsureUnitContent(product.UnitType, request.MainUnitType, request.ContentTotal);
        var equivalents = UnitConversion.EquivalentsFor(product.UnitType);
        var main = new ProductSaleMode
        {
            Product = product,
            UnitType = request.MainUnitType!.Value,
            QuantityEquivalent = request.ContentTotal!.Value,
            Price = request.StandardPrice!.Value,
            IsBaseMode = true,
        };
        var modes = new List<ProductSaleMode> { main };
        equivalents.TryAdd(main.UnitType, main.QuantityEquivalent);

        foreach (ProductSaleModeRequest modeRequest in request.SaleModes ?? new())
        {
            if (!equivalents.TryGetValue(modeRequest.RelativeUnitType!.Value, out double relative))
                throw new BadRequestException("Unidad relativa no válida o no definida para esta unidad base: " + modeRequest.RelativeUnitType);
            var mode = new ProductSaleMode
            {
                Product = product,
                UnitType = modeRequest.UnitType!.Value,
                QuantityEquivalent = modeRequest.RelativeQuantity!.Value * relative,
                Price = modeRequest.Price!.Value,
                IsBaseMode = false,
            };
            modes.Add(mode);
            equivalents.TryAdd(mode.UnitType, mode.QuantityEquivalent);
        }
        return modes;
    }

    public async Task<ProductResponse> GetAsync(long id, CancellationToken ct = default)
    {
        Product product = await WithDetails().AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("Producto no encontrado");
        long[] ids = { id };
        decimal total = (await _kardex.GetStockForProductsAsync(ids, null, ct)).GetValueOrDefault(id);
        var byBranch = (await _kardex.GetAggregatedBranchStockAsync(ids, ct)).GetValueOrDefault(id);
        return ToResponse(product, total, byBranch);
    }

    public async Task<List<ProductResponse>> GetManyAsync(List<long>? ids, CancellationToken ct = default)
    {
        if (ids is null || ids.Count == 0) return new List<ProductResponse>();
        List<Product> products = await WithDetails().AsNoTracking().Where(p => ids.Contains(p.Id)).ToListAsync(ct);
        if (products.Count != ids.Count) throw new BadRequestException("Uno o más productos no fueron encontrados");
        var totals = await _kardex.GetStockForProductsAsync(ids, null, ct);
        var byBranch = await _kardex.GetAggregatedBranchStockAsync(ids, ct);
        return products.Select(p => ToResponse(p, totals.GetValueOrDefault(p.Id), byBranch.GetValueOrDefault(p.Id))).ToList();
    }

    public async Task<PaginatedResponse<ProductSummaryResponse>> ListAsync(ProductListFilter f, CancellationToken ct = default)
    {
        IQueryable<Product> query = _db.Products.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(f.Q))
        {
            string like = $"%{f.Q.Trim()}%";
            query = query.Where(p => EF.Functions.ILike(p.Name, like) || EF.Functions.ILike(p.Sku, like) ||
                                     EF.Functions.ILike(p.Description, like));
        }
        if (f.CategoryId is not null and not 0) query = query.Where(p => p.CategoryId == f.CategoryId);
        if (f.Presentation is not null) query = query.Where(p => p.Presentation == f.Presentation);
        if (f.UnitType is not null) query = query.Where(p => p.UnitType == f.UnitType);
        if (f.Route is not null) query = query.Where(p => p.AdministrationRoutes.Any(r => r.Route == f.Route));
        if (f.HasSaleModes is not null) query = query.Where(p => p.SaleModes.Any() == f.HasSaleModes);
        bool byBranch = f.BranchId is not null and not 0;
        if (byBranch || f.Active is not null)
            query = query.Where(p => p.BranchStocks.Any(b =>
                (!byBranch || b.BranchId == f.BranchId) && (f.Active == null || b.IsActive == f.Active)));

        int page = Math.Max(f.Page, 0), size = Math.Max(f.Size, 1);
        long total = await query.LongCountAsync(ct);
        List<long> pageIds = await query.OrderBy(p => p.Name).ThenBy(p => p.Id).Skip(page * size).Take(size)
            .Select(p => p.Id).ToListAsync(ct);
        if (pageIds.Count == 0) return PaginatedResponse<ProductSummaryResponse>.Of(new List<ProductSummaryResponse>(), total, page, size);

        var products = (await WithDetails().AsNoTracking().Where(p => pageIds.Contains(p.Id)).ToListAsync(ct))
            .OrderBy(p => pageIds.IndexOf(p.Id)).ToList();
        var branchStock = await _kardex.GetAggregatedBranchStockAsync(pageIds, ct);
        Dictionary<long, decimal> mainStock = byBranch
            ? await _kardex.GetStockForProductsAsync(pageIds, f.BranchId, ct)
            : branchStock.ToDictionary(e => e.Key, e => e.Value.Values.Sum());

        IEnumerable<ProductSummaryResponse> content = products.Select(p =>
            ToSummary(p, mainStock.GetValueOrDefault(p.Id), branchStock.GetValueOrDefault(p.Id)));
        // Como en el backend anterior, estos dos filtros se aplican sobre la página ya cargada.
        if (f.AvailableOnly == true) content = content.Where(p => p.IsAvailable == true);
        if (f.MinStockAlertOnly == true) content = content.Where(p => p.IsBelowMinStock == true);
        return PaginatedResponse<ProductSummaryResponse>.Of(content.ToList(), total, page, size);
    }

    public async Task<List<ProductQuickSearchResponse>> QuickSearchAsync(string? name, long? branchId, CancellationToken ct = default)
    {
        IQueryable<Product> query = _db.Products.AsNoTracking().Where(p => p.BranchStocks.Any(b => b.IsActive));
        if (branchId is not null and not 0) query = query.Where(p => p.BranchStocks.Any(b => b.BranchId == branchId));
        if (!string.IsNullOrWhiteSpace(name))
        {
            string like = $"%{name.Trim()}%";
            query = query.Where(p => EF.Functions.ILike(p.Name, like) || EF.Functions.ILike(p.Sku, like));
        }
        var rows = await query.OrderBy(p => p.Name).Take(10)
            .Select(p => new
            {
                p.Id, p.Name, p.Presentation, p.Sku, p.UnitType, p.ContentTotal,
                Price = p.SaleModes.Where(m => m.IsBaseMode).OrderBy(m => m.Id).Select(m => (decimal?)m.Price).FirstOrDefault(),
            }).ToListAsync(ct);
        return rows.Select(r => new ProductQuickSearchResponse(r.Id, r.Name, r.Presentation.ToString(), r.Sku, r.Price,
            r.UnitType, (decimal)r.ContentTotal)).ToList();
    }

    public Task<ProductSummaryResponse> UpdateAsync(ProductUpdateRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Product product = await WithDetails().FirstOrDefaultAsync(p => p.Id == request.Id, ct)
                ?? throw new NotFoundException("Producto no encontrado");
            CategoryProduct category = await _db.CategoryProducts.FirstOrDefaultAsync(c => c.Id == request.CategoryId, ct)
                ?? throw new NotFoundException("Categoría no encontrada");
            if (await _db.Products.AnyAsync(p => p.Sku == request.Sku && p.Id != request.Id, ct))
                throw new BadRequestException("El SKU ya está en uso por otro producto");

            DeleteRemovedSaleModes(product, request);
            product.Name = request.Name!;
            product.Description = request.Description!;
            product.MinStock = request.MinStock!.Value;
            product.Sku = request.Sku!;
            product.Presentation = request.Presentation!;
            product.UnitType = request.BaseUnitType!.Value;
            product.Category = category;
            product.ContentTotal = request.ContentTotal!.Value;
            product.AdministrationRoutes.Clear();
            foreach (string route in request.AdministrationRoutes ?? new())
                product.AdministrationRoutes.Add(new ProductAdministrationRoute { ProductId = product.Id, Route = route });
            UpdateOrAddSaleModes(product, request);

            await _db.SaveChangesAsync(ct);
            return await SummaryWithStockAsync(product, ct);
        }, ct);

    /// <summary>Se eliminan los modos de venta que no vienen en la solicitud (el principal nunca).</summary>
    private void DeleteRemovedSaleModes(Product product, ProductUpdateRequest request)
    {
        var keep = (request.SaleModes ?? new()).Where(m => m.Id is not null).Select(m => m.Id!.Value).ToHashSet();
        ProductSaleMode baseMode = product.SaleModes.FirstOrDefault(m => m.IsBaseMode)
            ?? throw new BusinessRuleException("Producto no tiene modo de venta base.");
        keep.Add(baseMode.Id);
        foreach (ProductSaleMode removed in product.SaleModes.Where(m => !keep.Contains(m.Id)).ToList())
        {
            product.SaleModes.Remove(removed);
            _db.ProductSaleModes.Remove(removed);
        }
    }

    private static void UpdateOrAddSaleModes(Product product, ProductUpdateRequest request)
    {
        EnsureUnitContent(product.UnitType, request.MainUnitType, request.ContentTotal);
        ProductSaleMode baseMode = product.SaleModes.First(m => m.IsBaseMode);
        baseMode.UnitType = request.MainUnitType!.Value;
        baseMode.QuantityEquivalent = request.ContentTotal!.Value;
        baseMode.Price = request.StandardPrice!.Value;

        var equivalents = new Dictionary<ProductUnitType, double>
        {
            [product.UnitType] = 1.0,
            [baseMode.UnitType] = baseMode.QuantityEquivalent,
        };
        var unitTypes = new HashSet<ProductUnitType> { product.UnitType, baseMode.UnitType };

        foreach (ProductSaleModeRequest req in request.SaleModes ?? new())
        {
            ProductUnitType unit = req.UnitType!.Value;
            if (!unitTypes.Add(unit) && req.Id is null)
                throw new InvalidArgumentException("No se puede repetir el tipo de unidad en los modos de venta: " + unit);

            ProductUnitType relativeUnit = req.RelativeUnitType!.Value;
            if (!equivalents.TryGetValue(relativeUnit, out double relative))
            {
                relative = product.SaleModes.FirstOrDefault(m => m.UnitType == relativeUnit)?.QuantityEquivalent
                    ?? throw new BadRequestException("Unidad relativa no válida o no definida: " + relativeUnit);
                equivalents[relativeUnit] = relative;
            }
            double final = req.RelativeQuantity!.Value * relative;

            if (req.Id is not null)
            {
                ProductSaleMode existing = product.SaleModes.FirstOrDefault(m => m.Id == req.Id)
                    ?? throw new NotFoundException("Modo de venta no encontrado: " + req.Id);
                if (existing.IsBaseMode)
                    throw new InvalidArgumentException("No se puede actualizar el modo de venta base a través de la lista 'saleModes'.");
                if (existing.UnitType != unit)
                    throw new InvalidArgumentException("No se puede cambiar el tipo de unidad de un modo existente");
                existing.QuantityEquivalent = final;
                existing.Price = req.Price!.Value;
                equivalents[existing.UnitType] = final;
            }
            else
            {
                product.SaleModes.Add(new ProductSaleMode
                {
                    Product = product, UnitType = unit, QuantityEquivalent = final, Price = req.Price!.Value, IsBaseMode = false,
                });
                equivalents[unit] = final;
            }
        }
    }

    public Task SoftDeleteAsync(long id, long? branchId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Product product = await WithDetails().FirstOrDefaultAsync(p => p.Id == id, ct)
                ?? throw new NotFoundException("Producto no encontrado");
            if (branchId is null or 0)
            {
                foreach (ProductBranch stock in product.BranchStocks)
                {
                    if (await _kardex.GetCurrentStockAsync(id, stock.BranchId, ct) > 0)
                        throw new BadRequestException("No se puede desactivar el producto. Tiene stock en la sucursal: " + stock.Branch.Name);
                    stock.IsActive = false;
                }
            }
            else
            {
                ProductBranch stock = product.BranchStocks.FirstOrDefault(s => s.BranchId == branchId)
                    ?? throw new NotFoundException("Sucursal no encontrada para este producto.");
                if (await _kardex.GetCurrentStockAsync(id, branchId.Value, ct) > 0)
                    throw new BadRequestException("No se puede desactivar el producto porque tiene stock disponible en la sucursal.");
                stock.IsActive = false;
            }
            await _db.SaveChangesAsync(ct);
        }, ct);

    public Task HardDeleteAsync(long id, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Product product = await WithDetails().FirstOrDefaultAsync(p => p.Id == id, ct)
                ?? throw new NotFoundException("Producto no encontrado");
            foreach (ProductBranch stock in product.BranchStocks)
                if (await _kardex.GetCurrentStockAsync(id, stock.BranchId, ct) > 0)
                    throw new BadRequestException("No se puede eliminar el producto. Tiene stock en la sucursal: " + stock.Branch.Name);
            _db.Products.Remove(product);
            await _db.SaveChangesAsync(ct);
        }, ct);

    public Task<ProductSummaryResponse> RestoreAsync(long id, long? branchId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Product product = await WithDetails().FirstOrDefaultAsync(p => p.Id == id, ct)
                ?? throw new NotFoundException("Producto no encontrado");
            if (branchId is null or 0)
                foreach (ProductBranch stock in product.BranchStocks) stock.IsActive = true;
            else
            {
                ProductBranch stock = product.BranchStocks.FirstOrDefault(s => s.BranchId == branchId)
                    ?? throw new NotFoundException("Sucursal no encontrada para este producto.");
                stock.IsActive = true;
            }
            await _db.SaveChangesAsync(ct);
            return await SummaryWithStockAsync(product, ct);
        }, ct);
}
