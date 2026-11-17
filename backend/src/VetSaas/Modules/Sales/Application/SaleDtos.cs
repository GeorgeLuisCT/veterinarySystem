using FluentValidation;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Modules.Sales.Domain;

namespace VetSaas.Modules.Sales.Application;

/// <summary>Ítem facturable de otro módulo (servicio clínico, peluquería, cirugía…) que puede cobrarse en una venta.</summary>
public sealed record BillableServiceItem(
    BillableServiceType Type,
    long ItemId,
    long? BranchId,
    string? Description,
    decimal? UnitPrice,
    decimal? Quantity,
    decimal? TaxRate,
    string? MetadataJson);

/// <summary>
/// Cada módulo que genera cargos cobrables implementa un adaptador. La venta los consulta, los marca como facturados
/// al completarse y los libera al anularse.
/// </summary>
public interface IBillableServiceAdapter
{
    BillableServiceType SupportsType { get; }
    Task<BillableServiceItem> GetBillableItemAsync(long itemId, CancellationToken ct);
    Task MarkAsBilledAsync(long itemId, long saleDetailId, CancellationToken ct);
    Task MarkAsUnbilledAsync(long itemId, CancellationToken ct);
    Task<List<BillableServiceItem>> ListPendingAsync(long? branchId, long? attentionId, long? patientId, string? query, CancellationToken ct);
}

public sealed record SaleItemRequest(
    SaleItemKind? Kind,
    long? ProductId,
    long? SaleModeId,
    BillableServiceType? ServiceType,
    long? ServiceItemId,
    decimal? UnitPrice,
    decimal? Quantity,
    ProductUnitType? UnitType,
    decimal? TaxRate,
    decimal? TaxAmount,
    string? DescriptionOverride,
    string? MetadataJson);

public sealed class SaleItemRequestValidator : AbstractValidator<SaleItemRequest>
{
    public SaleItemRequestValidator()
    {
        RuleFor(i => i.Kind).NotNull().WithMessage("El tipo de ítem es obligatorio");
        RuleFor(i => i.UnitPrice).NotNull().WithMessage("El precio unitario es obligatorio")
            .GreaterThanOrEqualTo(0).WithMessage("El precio unitario no puede ser negativo");
        RuleFor(i => i.Quantity).NotNull().WithMessage("La cantidad es obligatoria")
            .GreaterThan(0).WithMessage("La cantidad debe ser mayor a 0");
        RuleFor(i => i.TaxRate).GreaterThanOrEqualTo(0).When(i => i.TaxRate is not null).WithMessage("La tasa de impuesto no puede ser negativa");
        RuleFor(i => i.TaxAmount).GreaterThanOrEqualTo(0).When(i => i.TaxAmount is not null).WithMessage("El impuesto no puede ser negativo");
        RuleFor(i => i).Must(ValidCombination)
            .WithMessage("Para ítems de tipo PRODUCT debe especificarse productId y sólo para SERVICE se admite serviceType/serviceItemId");
    }

    private static bool ValidCombination(SaleItemRequest i)
    {
        bool hasProduct = i.ProductId is not null;
        bool hasService = i.ServiceType is not null && i.ServiceItemId is not null;
        return i.Kind switch
        {
            SaleItemKind.PRODUCT => hasProduct && i.SaleModeId is not null && !hasService,
            SaleItemKind.SERVICE => !hasProduct && hasService,
            _ => false,
        };
    }
}

public sealed record SalePaymentRequest(decimal? Amount, PaymentMethod? Method, DateTime? PaidAt, string? Reference, string? Notes);

public sealed class SalePaymentRequestValidator : AbstractValidator<SalePaymentRequest>
{
    public SalePaymentRequestValidator()
    {
        RuleFor(p => p.Amount).NotNull().WithMessage("El monto es obligatorio").GreaterThan(0).WithMessage("El monto debe ser mayor a 0");
        RuleFor(p => p.Method).NotNull().WithMessage("El método de pago es obligatorio");
    }
}

public sealed record CreateSaleRequest(
    bool FinalizeSale,
    long? BranchId,
    long? SellerId,
    long? CustomerId,
    SalesDocumentType? DocumentType,
    string? DocumentNumber,
    List<SaleItemRequest>? Items,
    List<SalePaymentRequest>? Payments,
    string? Notes);

public sealed class CreateSaleRequestValidator : AbstractValidator<CreateSaleRequest>
{
    public CreateSaleRequestValidator()
    {
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sucursal es obligatoria");
        RuleFor(r => r.SellerId).NotNull().WithMessage("El vendedor es obligatorio");
        RuleFor(r => r.Items).NotEmpty().WithMessage("Debe registrar al menos un ítem");
        RuleForEach(r => r.Items).SetValidator(new SaleItemRequestValidator());
        RuleForEach(r => r.Payments).SetValidator(new SalePaymentRequestValidator());
    }
}

public sealed record UpdateSaleRequest(long? BranchId, long? SellerId, long? CustomerId, SalesDocumentType? DocumentType,
    string? DocumentNumber, string? Notes, long? SourceAttentionId);

public sealed class UpdateSaleRequestValidator : AbstractValidator<UpdateSaleRequest>
{
    public UpdateSaleRequestValidator()
    {
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sucursal es obligatoria");
        RuleFor(r => r.SellerId).NotNull().WithMessage("El vendedor es obligatorio");
        RuleFor(r => r.DocumentNumber).MaximumLength(32).WithMessage("El número de documento no debe superar los 32 caracteres");
    }
}

public sealed record FinalizeSaleRequest(List<SalePaymentRequest>? Payments);

public sealed class FinalizeSaleRequestValidator : AbstractValidator<FinalizeSaleRequest>
{
    public FinalizeSaleRequestValidator() => RuleForEach(r => r.Payments).SetValidator(new SalePaymentRequestValidator());
}

public sealed record VoidSaleRequest(string? Reason);

public sealed class VoidSaleRequestValidator : AbstractValidator<VoidSaleRequest>
{
    public VoidSaleRequestValidator() => RuleFor(r => r.Reason).NotEmpty().WithMessage("El motivo de la anulación es obligatorio");
}

public sealed record SaleDetailResponse(long Id, string Description, decimal UnitPrice, decimal Quantity, decimal LineSubtotal,
    decimal? TaxRate, decimal? TaxAmount, long? ProductId, long? ProductBatchId, long? SaleModeId, ProductUnitType? UnitType,
    double? QuantityEquivalent, BillableServiceType? ServiceType, long? ServiceItemId, string? MetadataJson)
{
    public static SaleDetailResponse From(SaleDetail d) => new(d.Id, d.ItemDescription, d.UnitPrice, d.Quantity, d.LineSubtotal,
        d.TaxRate, d.TaxAmount, d.ProductId, d.ProductBatchId, d.SaleModeId, d.UnitType, d.SaleMode?.QuantityEquivalent,
        d.ServiceType, d.ServiceItemId, d.MetadataJson);
}

public sealed record SalePaymentResponse(long Id, decimal Amount, PaymentMethod Method, DateTime PaidAt, string? Reference,
    string? Notes, long? CashSessionId)
{
    public static SalePaymentResponse From(SalePayment p) =>
        new(p.Id, p.AmountPaid, p.PaymentMethod, p.PaidAt, p.PaymentReference, p.Notes, p.CashSessionId);
}

public sealed record SaleResponse(
    long Id,
    long BranchId,
    string BranchName,
    long SellerId,
    string SellerName,
    long? CustomerId,
    string? CustomerName,
    SaleStatus Status,
    SalesDocumentType? DocumentType,
    string? DocumentNumber,
    decimal Subtotal,
    decimal TaxTotal,
    decimal GrandTotal,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? VoidedAt,
    string? VoidReason,
    long? SourceAttentionId,
    string? Notes,
    IReadOnlyList<SaleDetailResponse> Details,
    IReadOnlyList<SalePaymentResponse> Payments);

public sealed record SaleSummaryResponse(long Id, SalesDocumentType? DocumentType, string? DocumentNumber, SaleStatus Status,
    decimal GrandTotal, DateTime CreatedAt, long BranchId, long SellerId, long? CustomerId, string? CustomerName)
{
    public static SaleSummaryResponse From(Sale s) => new(s.Id, s.DocumentType, s.DocumentNumber, s.Status, s.GrandTotal,
        s.CreatedAt, s.BranchId, s.SellerId, s.CustomerId, s.Customer?.Name);
}

public sealed record SaleListFilter(int Page, int Size, string? Q, long? BranchId, long? CustomerId, long? SellerId,
    SaleStatus? Status, SalesDocumentType? DocumentType, string? DocumentNumber, DateTime? StartDate, DateTime? EndDate);
