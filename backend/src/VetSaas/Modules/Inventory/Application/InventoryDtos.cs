using System.Text.Json.Serialization;
using FluentValidation;
using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Employees.Application;
using VetSaas.Modules.Inventory.Domain;

namespace VetSaas.Modules.Inventory.Application;

// ---- Categorías ----

public sealed record CategoryProductRequest(string? Name);

public sealed class CategoryProductRequestValidator : AbstractValidator<CategoryProductRequest>
{
    public CategoryProductRequestValidator() => RuleFor(r => r.Name)
        .NotEmpty().WithMessage("El nombre no puede estar vacío")
        .MaximumLength(50).WithMessage("El nombre no debe superar los 50 caracteres")
        .Matches("^[^§¶¤¬]+$").WithMessage("El nombre no puede contener caracteres especiales como '§', '¶', '¤', '¬'");
}

public sealed record CategoryProductResponse(long Id, string Name, [property: JsonPropertyName("active")] bool IsActive)
{
    public static CategoryProductResponse From(CategoryProduct c) => new(c.Id, c.Name, c.IsActive);
}

// ---- Proveedores ----

public record BaseSupplierRequest
{
    public string? Name { get; init; }
    public string? Ruc { get; init; }
    public string? Address { get; init; }
    public string? Website { get; init; }
    public string? ContactPhone { get; init; }
    public string? Email { get; init; }
    public string? SupplierType { get; init; }
    public string? BankAccountNumber { get; init; }
    public string? BankName { get; init; }
}

public sealed record SupplierCreateRequest : BaseSupplierRequest;

public sealed record SupplierUpdateRequest : BaseSupplierRequest
{
    public long? Id { get; init; }
}

public abstract class BaseSupplierValidator<T> : AbstractValidator<T> where T : BaseSupplierRequest
{
    protected BaseSupplierValidator()
    {
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre es obligatorio")
            .MaximumLength(100).WithMessage("El nombre no debe superar los 100 caracteres");
        RuleFor(r => r.Ruc).NotEmpty().WithMessage("El RUC es obligatorio")
            .MaximumLength(20).WithMessage("El RUC no debe superar los 20 caracteres");
        RuleFor(r => r.Address).MaximumLength(250).WithMessage("La dirección no debe superar los 150 caracteres");
        RuleFor(r => r.Website).MaximumLength(250).WithMessage("El sitio web no debe superar los 100 caracteres");
        RuleFor(r => r.ContactPhone).MaximumLength(250).WithMessage("El teléfono de contacto no debe superar los 20 caracteres");
        RuleFor(r => r.Email).EmailAddress().When(r => !string.IsNullOrEmpty(r.Email)).WithMessage("Debe ingresar un correo válido")
            .MaximumLength(250).WithMessage("El correo no debe superar los 100 caracteres");
        RuleFor(r => r.SupplierType).NotNull().WithMessage("El tipo de proveedor es obligatorio");
        RuleFor(r => r.BankAccountNumber).MaximumLength(30).WithMessage("El número de cuenta no debe superar los 30 caracteres");
        RuleFor(r => r.BankName).MaximumLength(150).WithMessage("El nombre del banco no debe superar los 50 caracteres");
    }
}

public sealed class SupplierCreateRequestValidator : BaseSupplierValidator<SupplierCreateRequest>;

public sealed class SupplierUpdateRequestValidator : BaseSupplierValidator<SupplierUpdateRequest>
{
    public SupplierUpdateRequestValidator() => RuleFor(r => r.Id).NotNull().WithMessage("El ID del proveedor es obligatorio");
}

/// <summary>Detalle del proveedor; los campos sin valor no se envían.</summary>
public sealed record SupplierResponse(
    long Id,
    string Name,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Ruc,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Address,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Website,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? ContactPhone,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Email,
    string SupplierType,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? BankAccountNumber,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? BankName,
    bool Active)
{
    public static SupplierResponse From(Supplier s) => new(s.Id, s.Name, s.Ruc, s.Address, s.Website, s.Phone, s.Email,
        s.SupplierType, s.BankAccountNumber, s.BankName, s.Active);
}

public sealed record SupplierSummaryResponse(long Id, string? Name, string? Ruc, string? Address, string? Website,
    string? Phone, string? Email, string? SupplierType, string? BankName, string? BankAccountNumber, bool? Active)
{
    public static SupplierSummaryResponse From(Supplier s) => new(s.Id, s.Name, s.Ruc, s.Address, s.Website, s.Phone,
        s.Email, s.SupplierType, s.BankName, s.BankAccountNumber, s.Active);

    /// <summary>Solo id y nombre (como lo devolvía el detalle de un movimiento).</summary>
    public static SupplierSummaryResponse Minimal(Supplier s) =>
        new(s.Id, s.Name, null, null, null, null, null, null, null, null, null);
}

public sealed record SupplierQuickSearchResponse(long Id, string Name, string? Email);

// ---- Productos ----

public sealed record ProductSaleModeRequest(long? Id, ProductUnitType? UnitType, decimal? Price, double? RelativeQuantity,
    ProductUnitType? RelativeUnitType);

public record BaseProductRequest
{
    public string? Name { get; init; }
    public string? Description { get; init; }
    public int? MinStock { get; init; }
    public long? CategoryId { get; init; }
    public string? Sku { get; init; }
    public string? Presentation { get; init; }
    public ProductUnitType? BaseUnitType { get; init; }
    public ProductUnitType? MainUnitType { get; init; }
    public decimal? StandardPrice { get; init; }
    public double? ContentTotal { get; init; }
    public HashSet<string>? AdministrationRoutes { get; init; }
    public List<ProductSaleModeRequest>? SaleModes { get; init; }
}

public sealed record ProductCreateRequest : BaseProductRequest
{
    public HashSet<long>? BranchIds { get; init; }
}

public sealed record ProductUpdateRequest : BaseProductRequest
{
    public long? Id { get; init; }
}

public abstract class BaseProductValidator<T> : AbstractValidator<T> where T : BaseProductRequest
{
    protected BaseProductValidator()
    {
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no puede estar vacío")
            .MaximumLength(100).WithMessage("El nombre no debe exceder los 100 caracteres");
        RuleFor(r => r.Description).NotEmpty().WithMessage("La descripción no puede estar vacía");
        RuleFor(r => r.MinStock).NotNull().WithMessage("El stock mínimo es obligatorio")
            .GreaterThanOrEqualTo(0).WithMessage("El stock mínimo debe ser al menos 0");
        RuleFor(r => r.CategoryId).NotNull().WithMessage("El ID de la categoría es obligatorio");
        RuleFor(r => r.Sku).NotEmpty().WithMessage("El SKU no puede estar vacío")
            .MaximumLength(50).WithMessage("El SKU no debe exceder los 50 caracteres");
        RuleFor(r => r.Presentation).NotNull().WithMessage("La presentación del producto es obligatoria");
        RuleFor(r => r.BaseUnitType).NotNull().WithMessage("La unidad base es obligatoria");
        RuleFor(r => r.MainUnitType).NotNull().WithMessage("La unidad principal es obligatoria");
        RuleFor(r => r.StandardPrice).NotNull().WithMessage("El precio estándar es obligatorio");
        RuleFor(r => r.ContentTotal).NotNull().WithMessage("El contenido total es obligatorio")
            .GreaterThanOrEqualTo(0.01).WithMessage("El contenido total debe ser mayor a 0");
        RuleForEach(r => r.SaleModes).ChildRules(mode =>
        {
            mode.RuleFor(m => m.UnitType).NotNull().WithMessage("El tipo de unidad es obligatorio");
            mode.RuleFor(m => m.Price).NotNull().WithMessage("El precio es obligatorio")
                .GreaterThanOrEqualTo(0).WithMessage("El precio debe ser al menos 0.0");
            mode.RuleFor(m => m.RelativeQuantity).NotNull().WithMessage("La cantidad relativa es obligatoria")
                .GreaterThanOrEqualTo(0.01).WithMessage("La cantidad relativa debe ser positiva");
            mode.RuleFor(m => m.RelativeUnitType).NotNull().WithMessage("La unidad relativa es obligatoria");
        });
    }
}

public sealed class ProductCreateRequestValidator : BaseProductValidator<ProductCreateRequest>
{
    public ProductCreateRequestValidator() =>
        RuleFor(r => r.BranchIds).NotEmpty().WithMessage("Debes seleccionar al menos una sucursal");
}

public sealed class ProductUpdateRequestValidator : BaseProductValidator<ProductUpdateRequest>
{
    public ProductUpdateRequestValidator() => RuleFor(r => r.Id).NotNull().WithMessage("El ID del producto es obligatorio");
}

public sealed record SaleModeSummary(long Id, ProductUnitType UnitType, decimal RelativeQuantity, decimal Price,
    [property: JsonPropertyName("baseMode")] bool IsBaseMode);

public sealed record BranchStockSummary(long BranchId, string BranchName, bool Active, decimal StockMainUnit,
    decimal StockBaseUnitRemainder);

public sealed record ProductResponse(
    long Id,
    string Name,
    CategoryProductResponse? CategoryResponse,
    string Description,
    int MinStock,
    string Sku,
    string Presentation,
    ProductUnitType UnitType,
    double ContentTotal,
    decimal StandardPrice,
    IReadOnlyCollection<string> AdministrationRoutes,
    IReadOnlyList<SaleModeSummary> SaleModes,
    IReadOnlyList<BranchStockSummary> BranchStocks,
    decimal StockMainUnit,
    decimal StockBaseUnitRemainder,
    bool IsBelowMinStock,
    bool IsAvailable);

/// <summary>Resumen de producto. En el detalle de un movimiento solo lleva id, nombre y SKU (el resto en null).</summary>
public sealed record ProductSummaryResponse(
    long Id,
    string? Name,
    string? CategoryName,
    string? Description,
    int? MinStock,
    string? Sku,
    string? Presentation,
    ProductUnitType? UnitType,
    double? ContentTotal,
    decimal? StandardPrice,
    IReadOnlyCollection<string>? AdministrationRoutes,
    IReadOnlyList<SaleModeSummary>? SaleModes,
    IReadOnlyList<BranchStockSummary>? BranchStocks,
    decimal? StockMainUnit,
    decimal? StockBaseUnitRemainder,
    bool? IsBelowMinStock,
    bool? IsAvailable)
{
    public static ProductSummaryResponse Minimal(Product p) =>
        new(p.Id, p.Name, null, null, null, p.Sku, null, null, null, null, null, null, null, null, null, null, null);
}

public sealed record ProductQuickSearchResponse(long Id, string Name, string Presentation, string Sku,
    decimal? StandardPrice, ProductUnitType UnitType, decimal ContentTotal);

public sealed record ProductBasicResponse(long Id, string Name, string Sku, ProductUnitType UnitType,
    string Presentation)
{
    public static ProductBasicResponse From(Product p) => new(p.Id, p.Name, p.Sku, p.UnitType, p.Presentation);
}

// ---- Movimientos y kardex ----

public sealed record PurchaseProductRequest(long? ProductId, string? BatchNumber, DateOnly? ExpirationDate,
    double? Quantity, ProductUnitType? UnitType, decimal? UnitCost);

public sealed record PurchaseCreateRequest(long? BranchId, long? SupplierId, DateTime? Date, string? Description,
    List<PurchaseProductRequest>? Products, bool? PayNow, decimal? PaymentAmount, long? PaymentTreasuryAccountId);

public sealed class PurchaseCreateRequestValidator : AbstractValidator<PurchaseCreateRequest>
{
    public PurchaseCreateRequestValidator()
    {
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sucursal es obligatoria");
        RuleFor(r => r.SupplierId).NotNull().WithMessage("El proveedor es obligatorio");
        RuleFor(r => r.Date).NotNull().WithMessage("La fecha es obligatoria");
        RuleFor(r => r.Products).NotEmpty().WithMessage("Debe registrar al menos un producto");
        RuleFor(r => r.PaymentAmount).GreaterThan(0).When(r => r.PaymentAmount is not null)
            .WithMessage("El monto del pago debe ser mayor a 0");
        RuleForEach(r => r.Products).ChildRules(p =>
        {
            p.RuleFor(x => x.ProductId).NotNull().WithMessage("El producto es obligatorio");
            p.RuleFor(x => x.BatchNumber).NotEmpty().WithMessage("El número de lote es obligatorio");
            p.RuleFor(x => x.Quantity).NotNull().WithMessage("La cantidad es obligatoria")
                .GreaterThan(0).WithMessage("La cantidad debe ser mayor a 0");
            p.RuleFor(x => x.UnitType).NotNull().WithMessage("La unidad es obligatoria");
            p.RuleFor(x => x.UnitCost).NotNull().WithMessage("El costo unitario es obligatorio")
                .GreaterThanOrEqualTo(0).WithMessage("El costo unitario no puede ser negativo");
        });
    }
}

public sealed record TransferProductRequest(long? ProductId, long? BatchId, double? Quantity, ProductUnitType? UnitType);

public sealed record TransferCreateRequest(long? SourceBranchId, long? TargetBranchId, string? Description,
    List<TransferProductRequest>? Products);

public sealed class TransferCreateRequestValidator : AbstractValidator<TransferCreateRequest>
{
    public TransferCreateRequestValidator()
    {
        RuleFor(r => r.SourceBranchId).NotNull().WithMessage("La sucursal de origen es obligatoria");
        RuleFor(r => r.TargetBranchId).NotNull().WithMessage("La sucursal de destino es obligatoria");
        RuleFor(r => r.Products).NotEmpty().WithMessage("Debe registrar al menos un producto");
        RuleForEach(r => r.Products).ChildRules(p =>
        {
            p.RuleFor(x => x.ProductId).NotNull().WithMessage("El producto es obligatorio");
            p.RuleFor(x => x.BatchId).NotNull().WithMessage("El lote es obligatorio");
            p.RuleFor(x => x.Quantity).NotNull().WithMessage("La cantidad es obligatoria")
                .GreaterThan(0).WithMessage("La cantidad debe ser mayor a 0");
            p.RuleFor(x => x.UnitType).NotNull().WithMessage("La unidad es obligatoria");
        });
    }
}

public sealed record AdjustmentProductRequest(long? ProductId, long? BatchId, double? Quantity, ProductUnitType? UnitType,
    AdjustmentType? AdjustmentType, string? Reason);

public sealed record AdjustmentCreateRequest(long? BranchId, string? Description, List<AdjustmentProductRequest>? Products);

public sealed class AdjustmentCreateRequestValidator : AbstractValidator<AdjustmentCreateRequest>
{
    public AdjustmentCreateRequestValidator()
    {
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sucursal es obligatoria");
        RuleFor(r => r.Products).NotEmpty().WithMessage("Debe registrar al menos un producto");
        RuleForEach(r => r.Products).ChildRules(p =>
        {
            p.RuleFor(x => x.ProductId).NotNull().WithMessage("El producto es obligatorio");
            p.RuleFor(x => x.BatchId).NotNull().WithMessage("El lote es obligatorio");
            p.RuleFor(x => x.Quantity).NotNull().WithMessage("La cantidad es obligatoria")
                .GreaterThan(0).WithMessage("La cantidad debe ser mayor a 0");
            p.RuleFor(x => x.UnitType).NotNull().WithMessage("La unidad es obligatoria");
            p.RuleFor(x => x.AdjustmentType).NotNull().WithMessage("El tipo de ajuste es obligatorio");
        });
    }
}

public sealed record ProductBatchSummaryResponse(long Id, string BatchNumber, DateOnly? ExpirationDate);

public sealed record ProductBatchSearchResponse(long Id, string BatchNumber, long ProductId, DateOnly? ExpirationDate);

public sealed record InventoryMovementProductResponse(long Id, ProductSummaryResponse? Product,
    ProductBatchSummaryResponse? Batch, double Quantity, ProductUnitType UnitType, decimal? UnitCost);

public sealed record InventoryMovementResponse(
    long Id,
    InventoryMovementType Type,
    DateTime Date,
    BranchSummaryResponse? SourceBranch,
    BranchSummaryResponse? TargetBranch,
    SupplierSummaryResponse? Supplier,
    EmployeeSummaryResponse? Employee,
    string? Description,
    IReadOnlyList<InventoryMovementProductResponse> Products);

public sealed record InventoryMovementSummaryResponse(long Id, InventoryMovementType Type, DateTime Date,
    string? SourceBranchName, string? TargetBranchName, string? SupplierName, string? EmployeeName, string? Description);

public sealed record KardexMovementResponse(long Id, DateTime Date, KardexMovementType Type, decimal Quantity,
    decimal ResultingStock, long OriginId, string OriginType, string? ProductName, string? BatchNumber,
    DateOnly? ExpirationDate);
