using VetSaas.Modules.Sales.Application;
using VetSaas.Modules.Sales.Domain;
using VetSaas.Shared.Infrastructure.Validation;

namespace VetSaas.Modules.Sales.Endpoints;

public static class SalesEndpoints
{
    public static void MapSalesEndpoints(this WebApplication app)
    {
        var sales = app.MapGroup("/api/sales").WithTags("Sales");

        sales.MapPost("/", async (CreateSaleRequest request, ISaleService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(request, ct))).Validate<CreateSaleRequest>();

        sales.MapPut("/{id:long}", async (long id, UpdateSaleRequest request, ISaleService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(id, request, ct))).Validate<UpdateSaleRequest>();

        sales.MapGet("/{id:long}", async (long id, ISaleService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));

        sales.MapGet("/", async (ISaleService s, CancellationToken ct, int page = 0, int size = 20, string? q = null,
                long? branchId = null, long? customerId = null, long? sellerId = null, SaleStatus? status = null,
                SalesDocumentType? documentType = null, string? documentNumber = null, DateTime? startDate = null,
                DateTime? endDate = null) =>
            Results.Ok(await s.ListAsync(new SaleListFilter(page, size, q, branchId, customerId, sellerId, status, documentType,
                documentNumber, startDate, endDate), ct)));

        sales.MapPost("/{id:long}/void", async (long id, VoidSaleRequest request, ISaleService s, CancellationToken ct) =>
            Results.Ok(await s.VoidAsync(id, request, ct))).Validate<VoidSaleRequest>();

        sales.MapGet("/pending", async (ISaleService s, CancellationToken ct, long? branchId = null) =>
            Results.Ok(await s.ListPendingAsync(branchId, ct)));

        sales.MapGet("/billable-items", async (ISaleService s, CancellationToken ct, long? branchId = null, long? attentionId = null,
                long? patientId = null, string? q = null) =>
            Results.Ok(await s.ListBillableItemsAsync(branchId, attentionId, patientId, q, ct)));

        sales.MapPost("/{id:long}/details", async (long id, SaleItemRequest request, ISaleService s, CancellationToken ct) =>
            Results.Ok(await s.AddDetailAsync(id, request, ct))).Validate<SaleItemRequest>();

        sales.MapPut("/{id:long}/details/{detailId:long}", async (long id, long detailId, SaleItemRequest request, ISaleService s,
            CancellationToken ct) => Results.Ok(await s.UpdateDetailAsync(id, detailId, request, ct))).Validate<SaleItemRequest>();

        sales.MapDelete("/{id:long}/details/{detailId:long}", async (long id, long detailId, ISaleService s, CancellationToken ct) =>
        {
            await s.DeleteDetailAsync(id, detailId, ct);
            return Results.NoContent();
        });

        sales.MapPost("/{id:long}/payments", async (long id, SalePaymentRequest request, ISaleService s, CancellationToken ct) =>
            Results.Ok(await s.AddPaymentAsync(id, request, ct))).Validate<SalePaymentRequest>();

        sales.MapPut("/{id:long}/payments/{paymentId:long}", async (long id, long paymentId, SalePaymentRequest request,
            ISaleService s, CancellationToken ct) => Results.Ok(await s.UpdatePaymentAsync(id, paymentId, request, ct)))
            .Validate<SalePaymentRequest>();

        sales.MapDelete("/{id:long}/payments/{paymentId:long}", async (long id, long paymentId, ISaleService s, CancellationToken ct) =>
        {
            await s.DeletePaymentAsync(id, paymentId, ct);
            return Results.NoContent();
        });

        sales.MapPost("/{id:long}/finalize", async (long id, FinalizeSaleRequest request, ISaleService s, CancellationToken ct) =>
            Results.Ok(await s.FinalizeAsync(id, request, ct))).Validate<FinalizeSaleRequest>();

        var cash = app.MapGroup("/api/cash-sessions").WithTags("Cashbox");

        cash.MapPost("/", async (OpenCashSessionRequest request, ICashSessionService s, CancellationToken ct) =>
            Results.Ok(await s.OpenAsync(request, ct))).Validate<OpenCashSessionRequest>();

        cash.MapGet("/active", async (long branchId, ICashSessionService s, CancellationToken ct) =>
            Results.Ok(await s.GetActiveAsync(branchId, ct)));

        cash.MapGet("/{id:long}", async (long id, ICashSessionService s, CancellationToken ct) => Results.Ok(await s.GetDetailAsync(id, ct)));

        cash.MapPost("/{id:long}/movements", async (long id, RegisterCashMovementRequest request, ICashSessionService s,
            CancellationToken ct) => Results.Ok(await s.RegisterMovementAsync(id, request, ct))).Validate<RegisterCashMovementRequest>();

        cash.MapPost("/{id:long}/close", async (long id, CloseCashSessionRequest request, ICashSessionService s, CancellationToken ct) =>
            Results.Ok(await s.CloseAsync(id, request, ct))).Validate<CloseCashSessionRequest>();

        cash.MapGet("/history", async (ICashSessionService s, CancellationToken ct, long? branchId = null, long? cashierId = null,
                DateTime? startDate = null, DateTime? endDate = null, int page = 0, int size = 20) =>
            Results.Ok(await s.HistoryAsync(branchId, cashierId, startDate, endDate, page, size, ct)));
    }
}
