using VetSaas.Modules.Inventory.Application;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Http;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Validation;
using static VetSaas.Modules.Users.Domain.RoleName;

namespace VetSaas.Modules.Inventory.Endpoints;

public static class InventoryEndpoints
{
    public static void MapInventoryEndpoints(this WebApplication app)
    {
        // ---- Categorías ----
        var categories = app.MapGroup("/api/products/categories").WithTags("Inventory");

        categories.MapGet("/", async (ICategoryProductService s, CancellationToken ct) => Results.Ok(await s.GetAllAsync(ct)));

        categories.MapGet("/get", async (long id, ICategoryProductService s, CancellationToken ct) =>
            await s.GetByIdAsync(id, ct) is { } category ? Results.Ok(category) : Results.NotFound());

        categories.MapPost("/", async (CategoryProductRequest request, ICategoryProductService s, CancellationToken ct) =>
            Results.Ok(await s.SaveAsync(request, ct))).Validate<CategoryProductRequest>();

        categories.MapPut("/update-name", async (long id, string name, ICategoryProductService s, CancellationToken ct) =>
            await s.UpdateNameAsync(id, name, ct) is { } category ? Results.Ok(category) : Results.NotFound());

        categories.MapDelete("/soft", async (long id, ICategoryProductService s, CancellationToken ct) =>
            await s.SetActiveAsync(id, false, ct) ? Results.NoContent() : Results.NotFound());

        categories.MapDelete("/hard", async (long id, ICategoryProductService s, CancellationToken ct) =>
            await s.HardDeleteAsync(id, ct) ? Results.NoContent() : Results.NotFound());

        categories.MapPut("/restore", async (long id, ICategoryProductService s, CancellationToken ct) =>
            await s.SetActiveAsync(id, true, ct) ? Results.Ok() : Results.NotFound());

        // ---- Productos ----
        var products = app.MapGroup("/api/products").WithTags("Inventory");

        products.MapPost("/create", async (ProductCreateRequest request, IProductService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(request, ct)))
            .Validate<ProductCreateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        products.MapGet("/get", async (long id, IProductService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));

        products.MapPost("/by-ids", async (List<long> ids, IProductService s, CancellationToken ct) =>
            Results.Ok(await s.GetManyAsync(ids, ct)));

        products.MapGet("/", async (IProductService s, CancellationToken ct, int page = 0, int size = 10, string? q = null,
                long? categoryId = null, long? branchId = null, bool? active = null, ProductPresentationType? presentation = null,
                ProductUnitType? unitType = null, AdministrationRoute? route = null, bool? hasSaleModes = null,
                bool? availableOnly = null, bool? minStockAlertOnly = null) =>
            Results.Ok(await s.ListAsync(new ProductListFilter(page, size, q, categoryId, branchId, active, presentation, unitType,
                route, hasSaleModes, availableOnly, minStockAlertOnly), ct)));

        products.MapGet("/quick-search", async (string name, IProductService s, CancellationToken ct, long? branchId = null) =>
            Results.Ok(await s.QuickSearchAsync(name, branchId, ct)));

        products.MapPut("/update", async (ProductUpdateRequest request, IProductService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(request, ct)))
            .Validate<ProductUpdateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        products.MapDelete("/soft-delete", async (long id, IProductService s, CancellationToken ct, long? branchId = null) =>
        {
            await s.SoftDeleteAsync(id, branchId, ct);
            return Results.Ok(new MessageResponse("Producto desavilitado correctamente"));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        products.MapDelete("/hard-delete", async (long id, IProductService s, CancellationToken ct) =>
        {
            await s.HardDeleteAsync(id, ct);
            return Results.Ok(new MessageResponse("Producto eliminado permanentemente"));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER);

        products.MapPut("/restore", async (long id, IProductService s, CancellationToken ct, long? branchId = null) =>
            Results.Ok(await s.RestoreAsync(id, branchId, ct)))
            .RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        // ---- Proveedores ----
        var suppliers = app.MapGroup("/api/suppliers").WithTags("Inventory");

        suppliers.MapPost("/create", async (SupplierCreateRequest request, ISupplierService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(request, ct)))
            .Validate<SupplierCreateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        suppliers.MapGet("/get", async (long id, ISupplierService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));

        suppliers.MapGet("/", async (ISupplierService s, CancellationToken ct, int page = 0, int size = 10, bool? active = null,
                string? supplierType = null, string? q = null) =>
            Results.Ok(await s.ListAsync(page, size, active, supplierType, q, ct)));

        suppliers.MapGet("/quick-search", async (string query, ISupplierService s, CancellationToken ct) =>
            Results.Ok(await s.QuickSearchAsync(query, ct)));

        suppliers.MapPut("/update", async (SupplierUpdateRequest request, ISupplierService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(request, ct)))
            .Validate<SupplierUpdateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        suppliers.MapDelete("/soft-delete", async (long id, ISupplierService s, CancellationToken ct) =>
        {
            await s.SetActiveAsync(id, false, ct);
            return Results.Ok(new MessageResponse("Proveedor desactivado correctamente"));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        suppliers.MapDelete("/hard-delete", async (long id, ISupplierService s, CancellationToken ct) =>
        {
            await s.HardDeleteAsync(id, ct);
            return Results.Ok(new MessageResponse("Proveedor eliminado permanentemente"));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER);

        suppliers.MapPut("/restore", async (long id, ISupplierService s, CancellationToken ct) =>
            Results.Ok(await s.SetActiveAsync(id, true, ct)))
            .RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        // ---- Movimientos y kardex ----
        var movements = app.MapGroup("/api/inventory-movements").WithTags("Inventory");

        movements.MapPost("/purchase", async (PurchaseCreateRequest request, ICurrentUser user, IInventoryMovementService s,
                CancellationToken ct) => Results.Ok(await s.CreatePurchaseAsync(request, user.RequireEmployeeId(), ct)))
            .Validate<PurchaseCreateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        movements.MapPost("/transfer", async (TransferCreateRequest request, ICurrentUser user, IInventoryMovementService s,
                CancellationToken ct) => Results.Ok(await s.CreateTransferAsync(request, user.RequireEmployeeId(), ct)))
            .Validate<TransferCreateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        movements.MapPost("/adjustment", async (AdjustmentCreateRequest request, ICurrentUser user, IInventoryMovementService s,
                CancellationToken ct) => Results.Ok(await s.CreateAdjustmentAsync(request, user.RequireEmployeeId(), ct)))
            .Validate<AdjustmentCreateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_WAREHOUSE);

        movements.MapGet("/", async (IInventoryMovementService s, CancellationToken ct, int page = 0, int size = 10,
                long? branchId = null, QueryList<InventoryMovementType>? types = null, DateOnly? startDate = null, DateOnly? endDate = null) =>
            Results.Ok(await s.ListAsync(page, size, branchId, types, startDate, endDate, ct)));

        movements.MapGet("/{id:long}", async (long id, IInventoryMovementService s, CancellationToken ct) =>
            Results.Ok(await s.GetAsync(id, ct)));

        movements.MapGet("/kardex-history", async (long productId, IInventoryMovementService s, CancellationToken ct,
                int page = 0, int size = 10, long? branchId = null, long? batchId = null, DateOnly? startDate = null,
                DateOnly? endDate = null) =>
            Results.Ok(await s.GetKardexHistoryAsync(page, size, productId, branchId, batchId, startDate, endDate, ct)));

        movements.MapGet("/batches/search", async (long productId, string query, IInventoryMovementService s, CancellationToken ct) =>
            Results.Ok(await s.SearchBatchesAsync(productId, query, ct)));
    }
}
