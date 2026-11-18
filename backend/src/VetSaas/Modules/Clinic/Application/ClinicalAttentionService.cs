using System.Text.Json;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Modules.Customers.Application;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Inventory.Application;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Modules.Sales.Application;
using VetSaas.Modules.Sales.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Json;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Clinic.Application;

// ---- DTOs ----

public sealed record CreateClinicalAttentionRequest(long? AttentionId, DateTime? VisitDate, ClinicalAttentionStatus? Status);

public sealed class CreateClinicalAttentionValidator : AbstractValidator<CreateClinicalAttentionRequest>
{
    public CreateClinicalAttentionValidator() => RuleFor(r => r.AttentionId).NotNull().WithMessage("La atención es obligatoria");
}

/// <summary>PATCH: cada campo puede no venir (no se toca), venir en null (se borra) o con valor.</summary>
public sealed record UpdateClinicalAttentionRequest(
    uint? Version,
    Optional<DateTime?> VisitDate,
    Optional<ClinicalAttentionStatus?> Status,
    Optional<string?> Subjective,
    Optional<string?> Objective,
    Optional<string?> Assessment,
    Optional<string?> Plan,
    Optional<double?> WeightKg,
    Optional<double?> TemperatureCelsius,
    Optional<int?> HeartRate,
    Optional<int?> RespiratoryRate);

public sealed record AddClinicalAttentionMedicationRequest(long? ProductId, DateTime? AdministeredAt, decimal? DoseAmount,
    ProductUnitType? DoseUnit, string? Route, int? FrequencyValue, FrequencyUnit? FrequencyUnit,
    long? AdministeredByEmployeeId, string? Notes);

public sealed class AddClinicalAttentionMedicationValidator : AbstractValidator<AddClinicalAttentionMedicationRequest>
{
    public AddClinicalAttentionMedicationValidator()
    {
        RuleFor(r => r.ProductId).NotNull().WithMessage("El producto es obligatorio");
        RuleFor(r => r.AdministeredAt).NotNull().WithMessage("La fecha de administración es obligatoria");
    }
}

public sealed record AddClinicalServiceProductRequest(long? ProductId, decimal? Dose, ProductUnitType? Unit, string? AdministrationRoute);

public sealed record AddClinicalAttentionServiceItemRequest(long? ClinicalServiceId, decimal? UnitPrice, decimal? Quantity, string? Notes,
    List<AddClinicalServiceProductRequest>? Products);

public sealed class AddClinicalAttentionServiceItemValidator : AbstractValidator<AddClinicalAttentionServiceItemRequest>
{
    public AddClinicalAttentionServiceItemValidator()
    {
        RuleFor(r => r.ClinicalServiceId).NotNull().WithMessage("El servicio es obligatorio");
        RuleFor(r => r.UnitPrice).NotNull().WithMessage("El precio es obligatorio");
        RuleFor(r => r.Quantity).NotNull().WithMessage("La cantidad es obligatoria");
    }
}

public sealed record AddClinicalAttentionSurgicalOrderRequest(long? RecommendedServiceId, long? RequestedByEmployeeId, long? OperatingRoomId,
    SurgicalOrderStatus? Status, string? Notes);

public sealed class AddClinicalAttentionSurgicalOrderValidator : AbstractValidator<AddClinicalAttentionSurgicalOrderRequest>
{
    public AddClinicalAttentionSurgicalOrderValidator()
    {
        RuleFor(r => r.RecommendedServiceId).NotNull().WithMessage("El servicio recomendado es obligatorio");
        RuleFor(r => r.RequestedByEmployeeId).NotNull().WithMessage("El solicitante es obligatorio");
    }
}

public sealed record AddClinicalAttentionLaboratoryItem(long? TestId, decimal? UnitPrice, decimal? Quantity, string? Notes);

public sealed record AddClinicalAttentionLaboratoryRequest(long? LaboratoryId, long? RequestingEmployeeId, LabRequestStatus? Status,
    DateTime? CreatedAt, string? ClinicalNotes, List<AddClinicalAttentionLaboratoryItem>? Items);

public sealed class AddClinicalAttentionLaboratoryValidator : AbstractValidator<AddClinicalAttentionLaboratoryRequest>
{
    public AddClinicalAttentionLaboratoryValidator()
    {
        RuleFor(r => r.LaboratoryId).NotNull().WithMessage("El laboratorio es obligatorio");
        RuleFor(r => r.Items).NotNull().WithMessage("Debe registrar al menos una prueba de laboratorio.");
        RuleForEach(r => r.Items).ChildRules(i =>
        {
            i.RuleFor(x => x.TestId).NotNull().WithMessage("La prueba es obligatoria");
            i.RuleFor(x => x.UnitPrice).NotNull().WithMessage("El precio es obligatorio");
            i.RuleFor(x => x.Quantity).NotNull().WithMessage("La cantidad es obligatoria");
        });
    }
}

public sealed record ClinicalAttentionCreatedResponse(long AnimalId, long AttentionId, long ClinicalAttentionId, ClinicalAttentionStatus Status);

public sealed record ClinicalAttentionSummaryResponse(long Id, uint Version, long AttentionId, ClinicalAttentionStatus Status, DateTime VisitDate,
    AnimalBasicResponse? AnimalBasicResponse, string? ClinicalServiceName, BranchResponse? Branch, long? AttendingEmployeeId,
    string? AttendingEmployeeFullName);

public sealed record MedicationAdministrationResponse(long Id, long ProductId, string? ProductName, DateTime AdministeredAt,
    decimal? DoseAmount, ProductUnitType? DoseUnit, string? Route, int? FrequencyValue, FrequencyUnit? FrequencyUnit,
    long? AdministeredByEmployeeId, string? AdministeredByEmployeeFullName, string? Notes);

public sealed record ClinicalServiceProductResponse(long Id, ProductBasicResponse? Product, decimal? Dose, ProductUnitType? Unit,
    string? AdministrationRoute);

public sealed record ClinicalServiceItemResponse(long Id, long ClinicalServiceId, string ClinicalServiceName,
    ClinicalServiceCategory ClinicalServiceCategory, IReadOnlyList<ClinicalServiceProductResponse> Products, decimal UnitPrice,
    decimal Quantity, decimal Subtotal, string? Notes);

public sealed record SurgicalOrderResponse(long Id, long AnimalId, string? AnimalName, string? OperationRoomName, long? OperationRoomId,
    long RecommendedServiceId, string? RecommendedServiceName, long RequestedById, string? RequestedByFullName,
    SurgicalOrderStatus Status, string? Notes, DateTime CreatedAt, DateTime? UpdatedAt, long? ScheduledAppointmentId,
    DateTime? ScheduledAppointmentStart);

public sealed record LaboratoryResultValueResponse(long Id, long ParameterId, string? ParameterName, double? NumericValue, string? TextValue,
    bool? BooleanValue, string? UnitOverride, bool? OutOfRange, string? Flag, string? Comment)
{
    public static LaboratoryResultValueResponse From(LaboratoryResultValue v) => new(v.Id, v.ParameterId, v.Parameter?.Name,
        v.NumericValue, v.TextValue, v.BooleanValue, v.UnitOverride, v.OutOfRange, v.Flag, v.Comment);
}

public sealed record LaboratoryRequestItemResponse(long Id, long TestId, string? TestName, string? TestCode, LabRequestItemStatus? Status,
    string? Notes, DateTime? RequestedAt, DateTime? ProcessedAt, DateTime? ReportedAt, DateTime? VerifiedAt, decimal UnitPrice,
    decimal Quantity, decimal Subtotal, IReadOnlyList<LaboratoryResultValueResponse>? Results,
    IReadOnlyList<LaboratoryTestParameterResponse>? Parameters)
{
    /// <summary>Detalle completo (con resultados y parámetros de la prueba).</summary>
    public static LaboratoryRequestItemResponse Full(LaboratoryRequestItem i) => new(i.Id, i.TestId, i.Test.Name, i.Test.Code, i.Status,
        i.Notes, i.RequestedAt, i.ProcessedAt, i.ReportedAt, i.VerifiedAt, i.UnitPrice, i.Quantity, i.Subtotal,
        i.Results.OrderBy(r => r.Id).Select(LaboratoryResultValueResponse.From).ToList(),
        i.Test.Parameters.OrderBy(p => p.Id).Select(LaboratoryTestParameterResponse.From).ToList());

    /// <summary>Versión resumida que se muestra dentro de la atención clínica.</summary>
    public static LaboratoryRequestItemResponse Brief(LaboratoryRequestItem i) => new(i.Id, i.TestId, i.Test?.Name, i.Test?.Code, null,
        i.Notes, null, null, null, null, i.UnitPrice, i.Quantity, i.Subtotal, null, null);
}

public sealed record LaboratoryRequestResponse(long Id, long LaboratoryId, string? LaboratoryName, long? RequestingEmployeeId,
    string? RequestingEmployeeFullName, LabRequestStatus Status, DateTime CreatedAt, string? ClinicalNotes,
    IReadOnlyList<LaboratoryRequestItemResponse> Items);

public sealed record ClinicalAttentionDetailResponse(long Id, uint Version, long AttentionId, ClinicalAttentionStatus Status, DateTime VisitDate,
    string? Subjective, string? Objective, string? Assessment, string? Plan, double? WeightKg, double? TemperatureCelsius, int? HeartRate,
    int? RespiratoryRate, ClinicalAttentionSummaryResponse Summary, AttentionSummaryResponse Attention,
    IReadOnlyList<MedicationAdministrationResponse> MedicationAdministrations, IReadOnlyList<ClinicalServiceItemResponse> ServiceItems,
    IReadOnlyList<SurgicalOrderResponse> SurgicalOrders, IReadOnlyList<LaboratoryRequestResponse> LaboratoryRequests);

public sealed record ClinicalAttentionPatchResponse(long Id, uint Version, ClinicalAttentionStatus Status, IReadOnlyDictionary<string, object?> Updated,
    ClinicalAttentionSummaryResponse Summary);

public sealed record ClinicalAttentionStatusGroupResponse(ClinicalAttentionStatus Status, IReadOnlyList<ClinicalAttentionSummaryResponse> Attentions);

internal static class ClinicalMapping
{
    public static ClinicalAttentionSummaryResponse ToSummary(ClinicalAttention ca)
    {
        Attentions a = ca.Attention;
        return new ClinicalAttentionSummaryResponse(ca.Id, ca.Version, a.Id, ca.Status, ca.VisitDate,
            a.Animal is null ? null : AnimalBasicResponse.From(a.Animal), a.Service?.Name, Names.Branch(a.Branch),
            a.AttendingEmployeeId, Names.Full(a.AttendingEmployee));
    }

    public static SurgicalOrderResponse ToOrderResponse(SurgicalOrder o) => new(o.Id, o.AnimalId, o.Animal?.Name, o.OperatingRoom?.Name,
        o.OperatingRoomId, o.RecommendedServiceId, o.RecommendedService?.Name, o.RequestedById, Names.Full(o.RequestedBy), o.Status, o.Notes,
        o.CreatedAt, o.UpdatedAt, o.ScheduledDetail?.AppointmentId, o.ScheduledDetail?.Appointment?.StartDateTime);

    public static ClinicalAttentionDetailResponse ToDetail(ClinicalAttention ca) => new(ca.Id, ca.Version, ca.AttentionId, ca.Status,
        ca.VisitDate, ca.Subjective, ca.Objective, ca.Assessment, ca.Plan, ca.WeightKg, ca.TemperatureCelsius, ca.HeartRate, ca.RespiratoryRate,
        ToSummary(ca), AttentionMapping.ToSummary(ca.Attention),
        ca.MedicationAdministrations.OrderBy(m => m.AdministeredAt).Select(m => new MedicationAdministrationResponse(m.Id, m.ProductId,
            m.Product?.Name, m.AdministeredAt, m.DoseAmount, m.DoseUnit, m.Route, m.FrequencyValue, m.FrequencyUnit, m.AdministeredById,
            Names.Full(m.AdministeredBy), m.Notes)).ToList(),
        ca.ServiceItems.OrderBy(i => i.Id).Select(i => new ClinicalServiceItemResponse(i.Id, i.ClinicalServiceId, i.ClinicalService.Name,
            i.ClinicalService.ClinicalServiceCategory,
            i.Products.OrderBy(p => p.Id).Select(p => new ClinicalServiceProductResponse(p.Id,
                p.Product is null ? null : ProductBasicResponse.From(p.Product), p.Dose, p.Unit, p.AdministrationRoute)).ToList(),
            i.UnitPrice, i.Quantity, i.Subtotal, i.Notes)).ToList(),
        ca.SurgicalOrders.OrderBy(o => o.CreatedAt).Select(ToOrderResponse).ToList(),
        ca.LaboratoryRequests.OrderBy(r => r.CreatedAt).Select(r => new LaboratoryRequestResponse(r.Id, r.LaboratoryId, r.Laboratory?.Name,
            r.RequestingEmployeeId, Names.Full(r.RequestingEmployee), r.Status, r.CreatedAt, r.ClinicalNotes,
            r.Items.OrderBy(i => i.Id).Select(LaboratoryRequestItemResponse.Brief).ToList())).ToList());
}

/// <summary>
/// Al cobrar o liberar un cargo de la atención: si ya no queda nada pendiente, la atención lista para facturar se cierra;
/// si vuelve a haber algo pendiente (venta anulada), la atención cerrada vuelve a «lista para facturar».
/// </summary>
internal static class ClinicalBillingCloser
{
    public static void OnBillingChanged(ClinicalAttention? ca)
    {
        if (ca is null) return;
        bool pending = ca.ServiceItems.Any(i => i.SaleDetailId is null) ||
                       ca.LaboratoryRequests.Where(r => r.Status != LabRequestStatus.CANCELED)
                           .SelectMany(r => r.Items).Any(i => i.SaleDetailId is null && i.Status != LabRequestItemStatus.CANCELED);
        if (!pending && ca.Status == ClinicalAttentionStatus.READY_TO_BILL) ca.Status = ClinicalAttentionStatus.CLOSED;
        else if (pending && ca.Status == ClinicalAttentionStatus.CLOSED) ca.Status = ClinicalAttentionStatus.READY_TO_BILL;
    }

    public static IQueryable<ClinicalAttention> WithCharges(this IQueryable<ClinicalAttention> q) =>
        q.Include(c => c.ServiceItems).Include(c => c.LaboratoryRequests).ThenInclude(r => r.Items);
}

// ---- Servicio ----

public interface IClinicalAttentionService
{
    Task<ClinicalAttentionCreatedResponse> CreateAsync(CreateClinicalAttentionRequest r, CancellationToken ct = default);
    Task<ClinicalAttentionDetailResponse> GetAsync(long id, CancellationToken ct = default);
    Task<ClinicalAttentionDetailResponse> GetOrCreateByAttentionAsync(long attentionId, CancellationToken ct = default);
    Task<ClinicalAttentionPatchResponse> UpdateAsync(long id, UpdateClinicalAttentionRequest r, CancellationToken ct = default);
    Task<ClinicalAttentionDetailResponse> RegisterMedicationAsync(long id, AddClinicalAttentionMedicationRequest r, CancellationToken ct = default);
    Task<ClinicalAttentionDetailResponse> AddServiceItemAsync(long id, AddClinicalAttentionServiceItemRequest r, CancellationToken ct = default);
    Task<ClinicalAttentionDetailResponse> AddSurgicalOrderAsync(long id, AddClinicalAttentionSurgicalOrderRequest r, CancellationToken ct = default);
    Task<ClinicalAttentionDetailResponse> AddLaboratoryRequestAsync(long id, AddClinicalAttentionLaboratoryRequest r, CancellationToken ct = default);
    Task<PaginatedResponse<ClinicalAttentionSummaryResponse>> ListAsync(IReadOnlyCollection<ClinicalAttentionStatus>? statuses, long? branchId,
        long? animalId, long? attentionId, long? attendingEmployeeId, DateOnly? startDate, DateOnly? endDate, int page, int size, CancellationToken ct = default);
    Task<List<ClinicalAttentionStatusGroupResponse>> ListActiveGroupedAsync(long? attendingEmployeeId, CancellationToken ct = default);
}

public sealed class ClinicalAttentionService : IClinicalAttentionService
{
    private static readonly ClinicalAttentionStatus[] ActiveStatuses =
    {
        ClinicalAttentionStatus.OPEN, ClinicalAttentionStatus.IN_PROGRESS, ClinicalAttentionStatus.WAITING_LAB, ClinicalAttentionStatus.READY_TO_BILL,
    };

    private readonly TenantDbContext _db;
    private readonly IInventoryConsumptionService _consumption;
    private readonly IClock _clock;

    public ClinicalAttentionService(TenantDbContext db, IInventoryConsumptionService consumption, IClock clock)
    {
        _db = db;
        _consumption = consumption;
        _clock = clock;
    }

    private IQueryable<ClinicalAttention> WithSummary() => _db.ClinicalAttentions
        .Include(c => c.Attention).ThenInclude(a => a.Animal)
        .Include(c => c.Attention).ThenInclude(a => a.Branch)
        .Include(c => c.Attention).ThenInclude(a => a.AttendingEmployee)
        .Include(c => c.Attention).ThenInclude(a => a.Service);

    private IQueryable<ClinicalAttention> Full() => WithSummary()
        .Include(c => c.MedicationAdministrations).ThenInclude(m => m.Product)
        .Include(c => c.MedicationAdministrations).ThenInclude(m => m.AdministeredBy)
        .Include(c => c.ServiceItems).ThenInclude(i => i.ClinicalService)
        .Include(c => c.ServiceItems).ThenInclude(i => i.Products).ThenInclude(p => p.Product)
        .Include(c => c.SurgicalOrders).ThenInclude(o => o.RecommendedService)
        .Include(c => c.SurgicalOrders).ThenInclude(o => o.RequestedBy)
        .Include(c => c.SurgicalOrders).ThenInclude(o => o.Animal)
        .Include(c => c.SurgicalOrders).ThenInclude(o => o.OperatingRoom)
        .Include(c => c.SurgicalOrders).ThenInclude(o => o.ScheduledDetail!).ThenInclude(d => d.Appointment)
        .Include(c => c.LaboratoryRequests).ThenInclude(r => r.Laboratory)
        .Include(c => c.LaboratoryRequests).ThenInclude(r => r.RequestingEmployee)
        .Include(c => c.LaboratoryRequests).ThenInclude(r => r.Items).ThenInclude(i => i.Test)
        .AsSplitQuery();

    private async Task<ClinicalAttention> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(c => c.Id == id, ct) ?? throw new InvalidArgumentException("ClinicalAttention no encontrada: id=" + id);

    private async Task<ClinicalAttentionDetailResponse> ReloadAsync(long id, CancellationToken ct)
    {
        _db.ChangeTracker.Clear();
        return ClinicalMapping.ToDetail(await Full().AsNoTracking().FirstAsync(c => c.Id == id, ct));
    }

    private static void AssertEditable(ClinicalAttention ca)
    {
        if (ca.Status is ClinicalAttentionStatus.CLOSED or ClinicalAttentionStatus.CANCELED)
            throw new BadRequestException($"La atención está {ca.Status.Label().ToLowerInvariant()} y ya no admite cambios");
    }

    private static string? Normalize(string? value) => Text.TrimToNull(value);

    public Task<ClinicalAttentionCreatedResponse> CreateAsync(CreateClinicalAttentionRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Attentions attention = await _db.Attentions.FirstOrDefaultAsync(a => a.Id == r.AttentionId, ct)
                ?? throw new InvalidArgumentException("Atención no encontrada: id=" + r.AttentionId);
            if (attention.Type != AttentionType.CLINIC)
                throw new ValidationFailedException("La atención clínica solo aplica a atenciones de tipo CLINIC");
            if (await _db.ClinicalAttentions.AnyAsync(c => c.AttentionId == attention.Id, ct))
                throw new BusinessRuleException("La atención clínica ya está registrada para la atención indicada.");
            var ca = new ClinicalAttention
            {
                Attention = attention, VisitDate = r.VisitDate ?? _clock.Now, Status = r.Status ?? ClinicalAttentionStatus.OPEN,
            };
            _db.ClinicalAttentions.Add(ca);
            await _db.SaveChangesAsync(ct);
            return new ClinicalAttentionCreatedResponse(attention.AnimalId, attention.Id, ca.Id, ca.Status);
        }, ct);

    public async Task<ClinicalAttentionDetailResponse> GetAsync(long id, CancellationToken ct = default) =>
        ClinicalMapping.ToDetail(await Full().AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)
                                 ?? throw new InvalidArgumentException("ClinicalAttention no encontrada: id=" + id));

    /// <summary>Abre (o reabre) la consulta de una atención: la pasa a «en consulta» y crea su ficha clínica si no existe.</summary>
    public Task<ClinicalAttentionDetailResponse> GetOrCreateByAttentionAsync(long attentionId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Attentions attention = await _db.Attentions.FirstOrDefaultAsync(a => a.Id == attentionId, ct)
                ?? throw new InvalidArgumentException("Atención no encontrada: id=" + attentionId);
            if (attention.Type != AttentionType.CLINIC)
                throw new BusinessRuleException("Solo se puede crear una atención clínica para atenciones de tipo CLINIC. " +
                                                $"Atención {attentionId} es de tipo {attention.Type}");
            await _db.Attentions.Where(a => a.Id == attentionId && a.Status == AttentionsStatus.WAITING)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, AttentionsStatus.IN_CONSULTATION), ct);

            long? existingId = await _db.ClinicalAttentions.Where(c => c.AttentionId == attentionId).Select(c => (long?)c.Id).FirstOrDefaultAsync(ct);
            if (existingId is null)
            {
                // Dos aperturas simultáneas: el índice único de attention_id deja crear solo una; la otra lee la existente.
                var visitDate = new Npgsql.NpgsqlParameter("visit", NpgsqlTypes.NpgsqlDbType.Timestamp) { Value = _clock.Now };
                await _db.Database.ExecuteSqlRawAsync(
                    "INSERT INTO clinical_attention (attention_id, visit_date, status) VALUES (@attention, @visit, @status) ON CONFLICT (attention_id) DO NOTHING",
                    new object[]
                    {
                        new Npgsql.NpgsqlParameter("attention", attentionId), visitDate,
                        new Npgsql.NpgsqlParameter("status", ClinicalAttentionStatus.OPEN.ToString()),
                    }, ct);
                existingId = await _db.ClinicalAttentions.Where(c => c.AttentionId == attentionId).Select(c => (long?)c.Id).FirstAsync(ct);
            }
            return await ReloadAsync(existingId!.Value, ct);
        }, ct);

    public Task<ClinicalAttentionPatchResponse> UpdateAsync(long id, UpdateClinicalAttentionRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            ClinicalAttention ca = await RequireAsync(id, ct);
            if (ca.Version != r.Version)
                throw new DbUpdateConcurrencyException("Version desactualizada");
            AssertEditable(ca);
            if (r.Status is { IsPresent: true, Value: { } target }) ValidateTransition(ca, target);

            var updated = new Dictionary<string, object?>();
            if (r.VisitDate.IsPresent) { ca.VisitDate = r.VisitDate.Value ?? ca.VisitDate; updated["visitDate"] = ca.VisitDate; }
            if (r.Status.IsPresent) { if (r.Status.Value is { } s) ca.Status = s; updated["status"] = ca.Status; }
            if (r.Subjective.IsPresent) { ca.Subjective = Normalize(r.Subjective.Value); updated["subjective"] = ca.Subjective; }
            if (r.Objective.IsPresent) { ca.Objective = Normalize(r.Objective.Value); updated["objective"] = ca.Objective; }
            if (r.Assessment.IsPresent) { ca.Assessment = Normalize(r.Assessment.Value); updated["assessment"] = ca.Assessment; }
            if (r.Plan.IsPresent) { ca.Plan = Normalize(r.Plan.Value); updated["plan"] = ca.Plan; }
            if (r.WeightKg.IsPresent) { ca.WeightKg = r.WeightKg.Value; updated["weightKg"] = ca.WeightKg; }
            if (r.TemperatureCelsius.IsPresent) { ca.TemperatureCelsius = r.TemperatureCelsius.Value; updated["temperatureCelsius"] = ca.TemperatureCelsius; }
            if (r.HeartRate.IsPresent) { ca.HeartRate = r.HeartRate.Value; updated["heartRate"] = ca.HeartRate; }
            if (r.RespiratoryRate.IsPresent) { ca.RespiratoryRate = r.RespiratoryRate.Value; updated["respiratoryRate"] = ca.RespiratoryRate; }

            await _db.SaveChangesAsync(ct);
            return new ClinicalAttentionPatchResponse(ca.Id, ca.Version, ca.Status, updated, ClinicalMapping.ToSummary(ca));
        }, ct);

    private static void ValidateTransition(ClinicalAttention ca, ClinicalAttentionStatus target)
    {
        ClinicalAttentionStatus current = ca.Status;
        if (current == target) return;
        bool allowed = current switch
        {
            ClinicalAttentionStatus.OPEN => target is ClinicalAttentionStatus.IN_PROGRESS or ClinicalAttentionStatus.WAITING_LAB
                or ClinicalAttentionStatus.READY_TO_BILL or ClinicalAttentionStatus.CANCELED,
            ClinicalAttentionStatus.IN_PROGRESS or ClinicalAttentionStatus.WAITING_LAB => target is ClinicalAttentionStatus.IN_PROGRESS
                or ClinicalAttentionStatus.WAITING_LAB or ClinicalAttentionStatus.READY_TO_BILL or ClinicalAttentionStatus.CANCELED,
            ClinicalAttentionStatus.READY_TO_BILL => target is ClinicalAttentionStatus.CLOSED or ClinicalAttentionStatus.IN_PROGRESS
                or ClinicalAttentionStatus.CANCELED,
            _ => false,
        };
        if (!allowed) throw new BadRequestException($"Transición de estado no permitida: {current.Label()} → {target.Label()}");
        bool anyBilled = ca.ServiceItems.Any(i => i.SaleDetailId is not null);
        if (current == ClinicalAttentionStatus.READY_TO_BILL && anyBilled &&
            target is ClinicalAttentionStatus.IN_PROGRESS or ClinicalAttentionStatus.CANCELED)
            throw new BadRequestException("La atención ya tiene servicios cobrados: no puede reabrirse ni cancelarse");
    }

    public Task<ClinicalAttentionDetailResponse> RegisterMedicationAsync(long id, AddClinicalAttentionMedicationRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            ClinicalAttention ca = await RequireAsync(id, ct);
            AssertEditable(ca);
            Product product = await _db.Products.FirstOrDefaultAsync(p => p.Id == r.ProductId, ct)
                ?? throw new InvalidArgumentException("Producto no encontrado: id=" + r.ProductId);
            Employee? by = r.AdministeredByEmployeeId is null
                ? null
                : await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.AdministeredByEmployeeId, ct)
                  ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + r.AdministeredByEmployeeId);
            var medication = new MedicationAdministration
            {
                ClinicalAttention = ca, AnimalId = ca.Attention.AnimalId, Product = product, AdministeredAt = r.AdministeredAt!.Value,
                DoseAmount = r.DoseAmount, DoseUnit = r.DoseUnit, Route = r.Route, FrequencyUnit = r.FrequencyUnit,
                FrequencyValue = r.FrequencyValue, AdministeredBy = by, Notes = Normalize(r.Notes),
            };
            _db.MedicationAdministrations.Add(medication);
            await _db.SaveChangesAsync(ct);
            // Lo administrado sale del inventario de la sucursal (lotes vigentes, el que vence primero).
            if (r.DoseAmount is > 0)
                await _consumption.ConsumeAsync(product.Id, ca.Attention.BranchId, r.DoseAmount, r.DoseUnit, "MedicationAdministration", medication.Id, ct);
            return await ReloadAsync(ca.Id, ct);
        }, ct);

    public Task<ClinicalAttentionDetailResponse> AddServiceItemAsync(long id, AddClinicalAttentionServiceItemRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            ClinicalAttention ca = await RequireAsync(id, ct);
            AssertEditable(ca);
            ClinicalService service = await _db.ClinicalServices.FirstOrDefaultAsync(s => s.Id == r.ClinicalServiceId, ct)
                ?? throw new InvalidArgumentException("Servicio clínico no encontrado: id=" + r.ClinicalServiceId);
            if (r.Quantity <= 0) throw new BadRequestException("La cantidad del servicio debe ser mayor a cero");
            if (r.UnitPrice < 0) throw new BadRequestException("El precio del servicio no puede ser negativo");
            var item = new ClinicalServiceItem
            {
                ClinicalAttention = ca, ClinicalService = service, UnitPrice = r.UnitPrice!.Value, Quantity = r.Quantity!.Value,
                Subtotal = r.UnitPrice!.Value * r.Quantity!.Value, Notes = Normalize(r.Notes),
            };
            foreach (AddClinicalServiceProductRequest p in r.Products ?? new())
            {
                Product product = await _db.Products.FirstOrDefaultAsync(x => x.Id == p.ProductId, ct)
                    ?? throw new InvalidArgumentException("Producto no encontrado: id=" + p.ProductId);
                item.Products.Add(new ClinicalServiceProduct { Product = product, Dose = p.Dose, Unit = p.Unit, AdministrationRoute = p.AdministrationRoute });
            }
            _db.ClinicalServiceItems.Add(item);
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(ca.Id, ct);
        }, ct);

    public Task<ClinicalAttentionDetailResponse> AddSurgicalOrderAsync(long id, AddClinicalAttentionSurgicalOrderRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            ClinicalAttention ca = await RequireAsync(id, ct);
            AssertEditable(ca);
            ClinicalService service = await _db.ClinicalServices.FirstOrDefaultAsync(s => s.Id == r.RecommendedServiceId, ct)
                ?? throw new InvalidArgumentException("Servicio clínico no encontrado: id=" + r.RecommendedServiceId);
            if (service.ClinicalServiceCategory != ClinicalServiceCategory.SURGERY)
                throw new InvalidArgumentException("El servicio recomendado debe pertenecer a la categoría SURGERY.");
            Employee requestedBy = await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.RequestedByEmployeeId, ct)
                ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + r.RequestedByEmployeeId);
            var room = r.OperatingRoomId is null
                ? null
                : await _db.OperatingRooms.FirstOrDefaultAsync(o => o.Id == r.OperatingRoomId, ct)
                  ?? throw new InvalidArgumentException("Sala de operaciones no encontrada: id=" + r.OperatingRoomId);
            _db.SurgicalOrders.Add(new SurgicalOrder
            {
                AnimalId = ca.Attention.AnimalId, RecommendedService = service, RequestedBy = requestedBy,
                Status = r.Status ?? SurgicalOrderStatus.PENDING, Notes = Normalize(r.Notes), ClinicalAttention = ca,
                OperatingRoom = room, CreatedAt = _clock.Now,
            });
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(ca.Id, ct);
        }, ct);

    public Task<ClinicalAttentionDetailResponse> AddLaboratoryRequestAsync(long id, AddClinicalAttentionLaboratoryRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            ClinicalAttention ca = await RequireAsync(id, ct);
            AssertEditable(ca);
            var lab = await _db.Laboratories.FirstOrDefaultAsync(l => l.Id == r.LaboratoryId, ct)
                ?? throw new InvalidArgumentException("Laboratorio no encontrado: id=" + r.LaboratoryId);
            Employee? requesting = r.RequestingEmployeeId is null
                ? null
                : await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.RequestingEmployeeId, ct)
                  ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + r.RequestingEmployeeId);
            if (r.Items is null || r.Items.Count == 0) throw new InvalidArgumentException("Debe registrar al menos una prueba de laboratorio.");
            var request = new LaboratoryRequest
            {
                ClinicalAttention = ca, AnimalId = ca.Attention.AnimalId, RequestingEmployee = requesting, Laboratory = lab,
                Status = r.Status ?? LabRequestStatus.REQUESTED, CreatedAt = r.CreatedAt ?? _clock.Now, ClinicalNotes = Normalize(r.ClinicalNotes),
            };
            foreach (AddClinicalAttentionLaboratoryItem i in r.Items)
            {
                LaboratoryTest test = await _db.LaboratoryTests.FirstOrDefaultAsync(t => t.Id == i.TestId, ct)
                    ?? throw new InvalidArgumentException("Prueba de laboratorio no encontrada: id=" + i.TestId);
                request.Items.Add(new LaboratoryRequestItem
                {
                    LaboratoryRequest = request, Test = test, Status = LabRequestItemStatus.REQUESTED, UnitPrice = i.UnitPrice!.Value,
                    Quantity = i.Quantity!.Value, Subtotal = i.UnitPrice!.Value * i.Quantity!.Value, Notes = Normalize(i.Notes),
                });
            }
            _db.LaboratoryRequests.Add(request);
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(ca.Id, ct);
        }, ct);

    public async Task<PaginatedResponse<ClinicalAttentionSummaryResponse>> ListAsync(IReadOnlyCollection<ClinicalAttentionStatus>? statuses,
        long? branchId, long? animalId, long? attentionId, long? attendingEmployeeId, DateOnly? startDate, DateOnly? endDate, int page, int size,
        CancellationToken ct = default)
    {
        IQueryable<ClinicalAttention> query = WithSummary().AsNoTracking();
        if (statuses is { Count: > 0 }) query = query.Where(c => statuses.Contains(c.Status));
        if (branchId is not null) query = query.Where(c => c.Attention.BranchId == branchId);
        if (animalId is not null) query = query.Where(c => c.Attention.AnimalId == animalId);
        if (attentionId is not null) query = query.Where(c => c.AttentionId == attentionId);
        if (attendingEmployeeId is not null) query = query.Where(c => c.Attention.AttendingEmployeeId == attendingEmployeeId);
        if (startDate is not null)
        {
            DateTime from = startDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(c => c.VisitDate >= from);
        }
        if (endDate is not null)
        {
            DateTime to = endDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(c => c.VisitDate < to);
        }
        var result = await query.OrderByDescending(c => c.VisitDate).ThenByDescending(c => c.Id).ToPageAsync(page, size, ct);
        return result.Map(ClinicalMapping.ToSummary);
    }

    public async Task<List<ClinicalAttentionStatusGroupResponse>> ListActiveGroupedAsync(long? attendingEmployeeId, CancellationToken ct = default)
    {
        IQueryable<ClinicalAttention> query = WithSummary().AsNoTracking().Where(c => ActiveStatuses.Contains(c.Status));
        if (attendingEmployeeId is not null) query = query.Where(c => c.Attention.AttendingEmployeeId == attendingEmployeeId);
        List<ClinicalAttention> rows = await query.ToListAsync(ct);
        return ActiveStatuses.Select(status => new ClinicalAttentionStatusGroupResponse(status,
            rows.Where(c => c.Status == status).OrderByDescending(c => c.VisitDate).Select(ClinicalMapping.ToSummary).ToList())).ToList();
    }
}

// ---- Adaptadores facturables (servicios clínicos y exámenes de laboratorio) ----

public sealed class ClinicalServiceItemBillableAdapter : IBillableServiceAdapter
{
    private readonly TenantDbContext _db;

    public ClinicalServiceItemBillableAdapter(TenantDbContext db) => _db = db;

    public BillableServiceType SupportsType => BillableServiceType.CLINICAL_SERVICE_ITEM;

    private IQueryable<ClinicalServiceItem> Items() => _db.ClinicalServiceItems
        .Include(i => i.ClinicalService)
        .Include(i => i.ClinicalAttention).ThenInclude(c => c.Attention).ThenInclude(a => a.Animal);

    private static string Metadata(ClinicalServiceItem item)
    {
        ClinicalAttention ca = item.ClinicalAttention;
        Attentions a = ca.Attention;
        return JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["clinicalAttentionId"] = ca.Id,
            ["attentionId"] = a.Id,
            ["animalId"] = a.AnimalId,
            ["animalName"] = a.Animal.Name,
            ["clinicalServiceId"] = item.ClinicalServiceId,
            ["clinicalServiceName"] = item.ClinicalService.Name,
            ["clinicalServiceCategory"] = item.ClinicalService.ClinicalServiceCategory.ToString(),
        }, JsonSetup.Options);
    }

    public async Task<BillableServiceItem> GetBillableItemAsync(long itemId, CancellationToken ct)
    {
        ClinicalServiceItem item = await Items().FirstOrDefaultAsync(i => i.Id == itemId, ct) ?? throw new NotFoundException("Ítem clínico no encontrado");
        if (item.SaleDetailId is not null) throw new BadRequestException($"El servicio clínico #{item.Id} ya fue cobrado en otra venta");
        if (item.ClinicalAttention.Status != ClinicalAttentionStatus.READY_TO_BILL)
            throw new BadRequestException("La atención clínica aún no está lista para facturar");
        string description = string.IsNullOrWhiteSpace(item.ClinicalService.Name) ? $"Servicio clínico #{item.Id}" : item.ClinicalService.Name;
        return new BillableServiceItem(SupportsType, item.Id, item.ClinicalAttention.Attention.BranchId, description, item.UnitPrice,
            item.Quantity, null, Metadata(item));
    }

    public async Task MarkAsBilledAsync(long itemId, long saleDetailId, CancellationToken ct)
    {
        ClinicalServiceItem item = await _db.ClinicalServiceItems.FirstOrDefaultAsync(i => i.Id == itemId, ct) ?? throw new NotFoundException("Ítem clínico no encontrado");
        if (item.SaleDetailId is not null && item.SaleDetailId != saleDetailId)
            throw new BadRequestException($"El servicio clínico #{itemId} ya fue cobrado en otra venta");
        item.SaleDetailId = saleDetailId;
        ClinicalBillingCloser.OnBillingChanged(await _db.ClinicalAttentions.WithCharges().FirstAsync(c => c.Id == item.ClinicalAttentionId, ct));
        await _db.SaveChangesAsync(ct);
    }

    public async Task MarkAsUnbilledAsync(long itemId, CancellationToken ct)
    {
        ClinicalServiceItem? item = await _db.ClinicalServiceItems.FirstOrDefaultAsync(i => i.Id == itemId, ct);
        if (item is null) return;
        item.SaleDetailId = null;
        ClinicalBillingCloser.OnBillingChanged(await _db.ClinicalAttentions.WithCharges().FirstAsync(c => c.Id == item.ClinicalAttentionId, ct));
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<BillableServiceItem>> ListPendingAsync(long? branchId, long? attentionId, long? patientId, string? query, CancellationToken ct)
    {
        IQueryable<ClinicalServiceItem> items = Items().AsNoTracking()
            .Where(i => i.SaleDetailId == null && i.ClinicalAttention.Status == ClinicalAttentionStatus.READY_TO_BILL);
        if (branchId is not null) items = items.Where(i => i.ClinicalAttention.Attention.BranchId == branchId);
        if (attentionId is not null) items = items.Where(i => i.ClinicalAttention.AttentionId == attentionId);
        if (patientId is not null) items = items.Where(i => i.ClinicalAttention.Attention.AnimalId == patientId);
        if (query is not null)
        {
            string like = $"%{query}%";
            items = items.Where(i => EF.Functions.ILike(i.ClinicalService.Name, like) || EF.Functions.ILike(i.ClinicalAttention.Attention.Animal.Name, like));
        }
        var rows = await items.OrderByDescending(i => i.ClinicalAttention.VisitDate).ThenBy(i => i.Id).ToListAsync(ct);
        return rows.Select(i => new BillableServiceItem(SupportsType, i.Id, i.ClinicalAttention.Attention.BranchId,
            $"{i.ClinicalService.Name} — {i.ClinicalAttention.Attention.Animal.Name}", i.UnitPrice, i.Quantity, null, Metadata(i))).ToList();
    }
}

public sealed class LaboratoryItemBillableAdapter : IBillableServiceAdapter
{
    private readonly TenantDbContext _db;

    public LaboratoryItemBillableAdapter(TenantDbContext db) => _db = db;

    public BillableServiceType SupportsType => BillableServiceType.LABORATORY_ITEM;

    private IQueryable<LaboratoryRequestItem> Items() => _db.LaboratoryRequestItems
        .Include(i => i.Test)
        .Include(i => i.LaboratoryRequest).ThenInclude(r => r.Animal)
        .Include(i => i.LaboratoryRequest).ThenInclude(r => r.Laboratory);

    private BillableServiceItem ToBillable(LaboratoryRequestItem i) => new(SupportsType, i.Id, i.LaboratoryRequest.Laboratory.BranchId,
        $"Laboratorio: {i.Test.Name} — {i.LaboratoryRequest.Animal.Name}", i.UnitPrice, i.Quantity, null, null);

    public async Task<BillableServiceItem> GetBillableItemAsync(long itemId, CancellationToken ct)
    {
        LaboratoryRequestItem item = await Items().FirstOrDefaultAsync(i => i.Id == itemId, ct) ?? throw new NotFoundException("Examen de laboratorio no encontrado");
        if (item.SaleDetailId is not null) throw new BadRequestException($"El examen #{itemId} ya fue cobrado en otra venta");
        if (item.Status == LabRequestItemStatus.CANCELED || item.LaboratoryRequest.Status == LabRequestStatus.CANCELED)
            throw new BadRequestException($"El examen #{itemId} fue cancelado y no puede cobrarse");
        return ToBillable(item);
    }

    private async Task OnChangedAsync(LaboratoryRequestItem item, CancellationToken ct)
    {
        long? caId = await _db.LaboratoryRequests.Where(r => r.Id == item.LaboratoryRequestId).Select(r => r.ClinicalAttentionId).FirstAsync(ct);
        if (caId is not null) ClinicalBillingCloser.OnBillingChanged(await _db.ClinicalAttentions.WithCharges().FirstAsync(c => c.Id == caId, ct));
    }

    public async Task MarkAsBilledAsync(long itemId, long saleDetailId, CancellationToken ct)
    {
        LaboratoryRequestItem item = await _db.LaboratoryRequestItems.FirstOrDefaultAsync(i => i.Id == itemId, ct) ?? throw new NotFoundException("Examen de laboratorio no encontrado");
        if (item.SaleDetailId is not null && item.SaleDetailId != saleDetailId)
            throw new BadRequestException($"El examen #{itemId} ya fue cobrado en otra venta");
        item.SaleDetailId = saleDetailId;
        await OnChangedAsync(item, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task MarkAsUnbilledAsync(long itemId, CancellationToken ct)
    {
        LaboratoryRequestItem? item = await _db.LaboratoryRequestItems.FirstOrDefaultAsync(i => i.Id == itemId, ct);
        if (item is null) return;
        item.SaleDetailId = null;
        await OnChangedAsync(item, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<BillableServiceItem>> ListPendingAsync(long? branchId, long? attentionId, long? patientId, string? query, CancellationToken ct)
    {
        IQueryable<LaboratoryRequestItem> items = Items().AsNoTracking()
            .Where(i => i.SaleDetailId == null && i.Status != LabRequestItemStatus.CANCELED && i.LaboratoryRequest.Status != LabRequestStatus.CANCELED);
        if (branchId is not null) items = items.Where(i => i.LaboratoryRequest.Laboratory.BranchId == branchId);
        if (attentionId is not null) items = items.Where(i => i.LaboratoryRequest.ClinicalAttention != null && i.LaboratoryRequest.ClinicalAttention.AttentionId == attentionId);
        if (patientId is not null) items = items.Where(i => i.LaboratoryRequest.AnimalId == patientId);
        if (query is not null)
        {
            string like = $"%{query}%";
            items = items.Where(i => EF.Functions.ILike(i.Test.Name, like) || EF.Functions.ILike(i.LaboratoryRequest.Animal.Name, like));
        }
        return (await items.OrderByDescending(i => i.LaboratoryRequest.CreatedAt).ThenBy(i => i.Id).ToListAsync(ct)).Select(ToBillable).ToList();
    }
}
