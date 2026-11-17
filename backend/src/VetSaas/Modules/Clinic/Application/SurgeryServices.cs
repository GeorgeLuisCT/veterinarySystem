using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Modules.Customers.Application;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Inventory.Application;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Json;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Clinic.Application;

// =====================================================================================================
// Órdenes quirúrgicas
// =====================================================================================================

public sealed record CreateSurgicalOrderRequest(long? AnimalId, long? RecommendedServiceId, long? RequestedById, long? OperationRoomId,
    string? Notes, SurgicalOrderStatus? Status);

public sealed class CreateSurgicalOrderValidator : AbstractValidator<CreateSurgicalOrderRequest>
{
    public CreateSurgicalOrderValidator()
    {
        RuleFor(r => r.AnimalId).NotNull().WithMessage("El paciente es obligatorio");
        RuleFor(r => r.RecommendedServiceId).NotNull().WithMessage("El servicio recomendado es obligatorio");
        RuleFor(r => r.RequestedById).NotNull().WithMessage("El solicitante es obligatorio");
    }
}

public sealed record UpdateSurgicalOrderRequest(long? RecommendedServiceId, long? RequestedById, long? OperatingRoomId, string? Notes,
    SurgicalOrderStatus? Status);

public sealed record SurgicalOrderSummaryResponse(long Id, long RecommendedServiceId, string? RecommendedServiceName, SurgicalOrderStatus Status,
    string? Notes, DateTime CreatedAt);

public interface ISurgicalOrderService
{
    Task<PaginatedResponse<SurgicalOrderResponse>> ListAsync(SurgicalOrderStatus? status, long? animalId, long? branchId, long? recommendedServiceId, int page, int size, CancellationToken ct = default);
    Task<SurgicalOrderResponse> GetAsync(long id, CancellationToken ct = default);
    Task<SurgicalOrderResponse> CreateAsync(CreateSurgicalOrderRequest r, CancellationToken ct = default);
    Task<SurgicalOrderResponse> UpdateAsync(long id, UpdateSurgicalOrderRequest r, CancellationToken ct = default);
    Task DeleteAsync(long id, CancellationToken ct = default);
    Task<List<SurgicalOrderSummaryResponse>> PendingByAnimalAsync(long animalId, CancellationToken ct = default);
}

public sealed class SurgicalOrderService : ISurgicalOrderService
{
    private readonly TenantDbContext _db;
    private readonly IClock _clock;

    public SurgicalOrderService(TenantDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    private IQueryable<SurgicalOrder> Full() => _db.SurgicalOrders
        .Include(o => o.Animal).Include(o => o.OperatingRoom).Include(o => o.RecommendedService).Include(o => o.RequestedBy)
        .Include(o => o.ScheduledDetail!).ThenInclude(d => d.Appointment);

    private async Task<SurgicalOrder> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(o => o.Id == id, ct) ?? throw new InvalidArgumentException("Orden quirúrgica no encontrada: id=" + id);

    private async Task<ClinicalService> SurgicalServiceAsync(long? id, CancellationToken ct)
    {
        ClinicalService service = await _db.ClinicalServices.FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new InvalidArgumentException("Servicio clínico no encontrado: id=" + id);
        if (service.ClinicalServiceCategory != ClinicalServiceCategory.SURGERY)
            throw new InvalidArgumentException("El servicio clínico debe pertenecer a la categoría SURGERY.");
        return service;
    }

    private async Task<OperatingRoom> RoomAsync(long? id, CancellationToken ct) =>
        await _db.OperatingRooms.FirstOrDefaultAsync(r => r.Id == id, ct) ?? throw new InvalidArgumentException("Sala de operaciones no encontrada: id=" + id);

    private async Task<Employee> EmployeeAsync(long? id, CancellationToken ct) =>
        await _db.Employees.FirstOrDefaultAsync(e => e.Id == id, ct) ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + id);

    public async Task<PaginatedResponse<SurgicalOrderResponse>> ListAsync(SurgicalOrderStatus? status, long? animalId, long? branchId,
        long? recommendedServiceId, int page, int size, CancellationToken ct = default)
    {
        IQueryable<SurgicalOrder> query = Full().AsNoTracking();
        if (status is not null) query = query.Where(o => o.Status == status);
        if (animalId is not null) query = query.Where(o => o.AnimalId == animalId);
        if (branchId is not null) query = query.Where(o => o.OperatingRoom != null && o.OperatingRoom.BranchId == branchId);
        if (recommendedServiceId is not null) query = query.Where(o => o.RecommendedServiceId == recommendedServiceId);
        var result = await query.OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id).ToPageAsync(page, size, ct);
        return result.Map(ClinicalMapping.ToOrderResponse);
    }

    public async Task<SurgicalOrderResponse> GetAsync(long id, CancellationToken ct = default) => ClinicalMapping.ToOrderResponse(await RequireAsync(id, ct));

    public async Task<SurgicalOrderResponse> CreateAsync(CreateSurgicalOrderRequest r, CancellationToken ct = default)
    {
        var animal = await _db.Animals.FirstOrDefaultAsync(a => a.Id == r.AnimalId, ct) ?? throw new InvalidArgumentException("Animal no encontrado: id=" + r.AnimalId);
        var order = new SurgicalOrder
        {
            Animal = animal,
            OperatingRoom = r.OperationRoomId is null ? null : await RoomAsync(r.OperationRoomId, ct),
            RecommendedService = await SurgicalServiceAsync(r.RecommendedServiceId, ct),
            RequestedBy = await EmployeeAsync(r.RequestedById, ct),
            Status = r.Status ?? SurgicalOrderStatus.PENDING,
            Notes = Text.TrimToNull(r.Notes),
            CreatedAt = _clock.Now,
        };
        _db.SurgicalOrders.Add(order);
        await _db.SaveChangesAsync(ct);
        return ClinicalMapping.ToOrderResponse(order);
    }

    public async Task<SurgicalOrderResponse> UpdateAsync(long id, UpdateSurgicalOrderRequest r, CancellationToken ct = default)
    {
        SurgicalOrder order = await RequireAsync(id, ct);
        if (r.RecommendedServiceId is not null) order.RecommendedService = await SurgicalServiceAsync(r.RecommendedServiceId, ct);
        if (r.RequestedById is not null) order.RequestedBy = await EmployeeAsync(r.RequestedById, ct);
        if (r.OperatingRoomId is not null) order.OperatingRoom = await RoomAsync(r.OperatingRoomId, ct);
        if (r.Notes is not null) order.Notes = Text.TrimToNull(r.Notes);
        if (r.Status is not null) order.Status = r.Status.Value;
        order.UpdatedAt = _clock.Now;
        await _db.SaveChangesAsync(ct);
        return ClinicalMapping.ToOrderResponse(order);
    }

    public async Task DeleteAsync(long id, CancellationToken ct = default)
    {
        SurgicalOrder order = await RequireAsync(id, ct);
        if (order.ScheduledDetail is not null)
            throw new BusinessRuleException("No se puede eliminar una orden que ya está asociada a una cita quirúrgica.");
        _db.SurgicalOrders.Remove(order);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<SurgicalOrderSummaryResponse>> PendingByAnimalAsync(long animalId, CancellationToken ct = default) =>
        await _db.SurgicalOrders.AsNoTracking().Where(o => o.AnimalId == animalId && o.Status == SurgicalOrderStatus.PENDING)
            .OrderBy(o => o.Id)
            .Select(o => new SurgicalOrderSummaryResponse(o.Id, o.RecommendedServiceId, o.RecommendedService.Name, o.Status, o.Notes, o.CreatedAt))
            .ToListAsync(ct);
}

// =====================================================================================================
// Reportes quirúrgicos
// =====================================================================================================

public sealed record CreateSurgicalReportRequest(long? AttentionId, DateTime? SurgeryStartAt, DateTime? SurgeryEndAt, long? SurgeonId,
    long? AnesthesiologistId, long? OperatingRoomId, long? AssistantId, string? Monitoring, string? Findings,
    string? SurgicalTechniqueDescription, SurgicalReportStatus? Status);

public sealed class CreateSurgicalReportValidator : AbstractValidator<CreateSurgicalReportRequest>
{
    public CreateSurgicalReportValidator()
    {
        RuleFor(r => r.AttentionId).NotNull().WithMessage("La atención es obligatoria");
        RuleFor(r => r.SurgeryStartAt).NotNull().WithMessage("El inicio de la cirugía es obligatorio");
        RuleFor(r => r.SurgeonId).NotNull().WithMessage("El cirujano es obligatorio");
        RuleFor(r => r.OperatingRoomId).NotNull().WithMessage("La sala de operaciones es obligatoria");
    }
}

public sealed record UpdateSurgicalReportRequest(uint? Version, Optional<DateTime?> SurgeryStartAt, Optional<DateTime?> SurgeryEndAt,
    Optional<long?> SurgeonId, Optional<long?> AnesthesiologistId, Optional<long?> OperatingRoomId, Optional<long?> AssistantId,
    Optional<SurgicalReportStatus?> Status, Optional<string?> Monitoring, Optional<string?> Findings,
    Optional<string?> SurgicalTechniqueDescription);

public sealed record AddSurgicalReportAnestheticDrugRequest(long? ProductId, AnestheticPhase? Phase, decimal? DoseAmount,
    ProductUnitType? DoseUnit, AdministrationRoute? Route);

public sealed class AddSurgicalReportAnestheticDrugValidator : AbstractValidator<AddSurgicalReportAnestheticDrugRequest>
{
    public AddSurgicalReportAnestheticDrugValidator()
    {
        RuleFor(r => r.ProductId).NotNull().WithMessage("El producto es obligatorio");
        RuleFor(r => r.Phase).NotNull().WithMessage("La fase es obligatoria");
        RuleFor(r => r.DoseAmount).NotNull().WithMessage("La dosis es obligatoria");
        RuleFor(r => r.DoseUnit).NotNull().WithMessage("La unidad de la dosis es obligatoria");
    }
}

public sealed record AddSurgicalReportMaterialRequest(long? ProductId, string? UnregisteredProductName, int? Quantity, ProductUnitType? UnitType);

public sealed class AddSurgicalReportMaterialValidator : AbstractValidator<AddSurgicalReportMaterialRequest>
{
    public AddSurgicalReportMaterialValidator()
    {
        RuleFor(r => r.Quantity).NotNull().WithMessage("La cantidad es obligatoria.");
        RuleFor(r => r.UnitType).NotNull().WithMessage("El tipo de unidad es obligatorio.");
        RuleFor(r => r).Must(r => (r.ProductId is not null) ^ !string.IsNullOrWhiteSpace(r.UnregisteredProductName))
            .WithMessage("Debe especificarse un productId o un unregisteredProductName, pero no ambos.");
    }
}

public sealed record AddSurgicalReportPostOperativeIndicationRequest(long? ProductId, decimal? DoseAmount, ProductUnitType? DoseUnit,
    int? FrequencyValue, FrequencyUnit? FrequencyUnit, AdministrationRoute? Route, string? NonDrugInstruction);

public sealed class AddSurgicalReportPostOperativeIndicationValidator : AbstractValidator<AddSurgicalReportPostOperativeIndicationRequest>
{
    public AddSurgicalReportPostOperativeIndicationValidator() => RuleFor(r => r).Must(r =>
    {
        bool hasProduct = r.ProductId is not null;
        bool hasInstruction = !string.IsNullOrWhiteSpace(r.NonDrugInstruction);
        if (hasProduct == hasInstruction) return false;
        return !hasProduct || (r.DoseAmount is not null && r.DoseUnit is not null);
    }).WithMessage("Debe especificar un producto con dosis o una instrucción no farmacológica, pero no ambos.");
}

public sealed record AnestheticDrugResponse(long Id, long ProductId, string? ProductName, AnestheticPhase Phase, decimal DoseAmount,
    ProductUnitType DoseUnit, AdministrationRoute? Route);

public sealed record SurgicalMaterialResponse(long Id, long? ProductId, string? ProductName, string? UnregisteredProductName, int Quantity,
    ProductUnitType UnitType);

public sealed record PostOperativeIndicationResponse(long Id, long? ProductId, string? ProductName, string? NonDrugInstruction,
    decimal? DoseAmount, ProductUnitType? DoseUnit, int? FrequencyValue, FrequencyUnit? FrequencyUnit, AdministrationRoute? Route);

public sealed record SurgicalReportSummaryResponse(long Id, uint Version, long AttentionId, DateTime? SurgeryStartAt, DateTime? SurgeryEndAt,
    SurgicalReportStatus Status, AnimalBasicResponse? AnimalBasicResponse, string? ClinicalServiceName, BranchResponse? Branch, long? SurgeonId,
    string? SurgeonFullName, long? AnesthesiologistId, string? AnesthesiologistFullName, long? AssistantId, string? AssistantFullName,
    long? OperatingRoomId, string? OperatingRoomName);

public sealed record SurgicalReportDetailResponse(long Id, uint Version, long AttentionId, long? SurgicalOrderId, SurgicalReportStatus Status,
    DateTime? SurgeryStartAt, DateTime? SurgeryEndAt, long? SurgeonId, string? SurgeonFullName, long? AnesthesiologistId,
    string? AnesthesiologistFullName, long? AssistantId, string? AssistantFullName, long? OperatingRoomId, string? OperatingRoomName,
    string? Monitoring, string? Findings, string? SurgicalTechniqueDescription, SurgicalReportSummaryResponse Summary,
    IReadOnlyList<AnestheticDrugResponse> AnestheticProtocol, IReadOnlyList<SurgicalMaterialResponse> MaterialsUsed,
    IReadOnlyList<PostOperativeIndicationResponse> PostOperativeIndications);

public sealed record SurgicalReportCreatedResponse(long SurgicalReportId, long AttentionId, DateTime? SurgeryStartAt, DateTime? SurgeryEndAt,
    long SurgeonId, SurgicalReportStatus Status);

public sealed record SurgicalReportPatchResponse(long Id, uint Version, SurgicalReportStatus Status, IReadOnlyDictionary<string, object?> Updated,
    SurgicalReportSummaryResponse Summary);

internal static class SurgeryMapping
{
    public static SurgicalReportSummaryResponse ToSummary(SurgicalReport r)
    {
        Attentions a = r.Attention;
        // Como en el backend anterior, el resumen no incluye la hora de término.
        return new SurgicalReportSummaryResponse(r.Id, r.Version, a.Id, r.SurgeryStartAt, null, r.Status,
            a.Animal is null ? null : AnimalBasicResponse.From(a.Animal), a.Service?.Name, Names.Branch(a.Branch), r.SurgeonId,
            Names.Full(r.Surgeon), r.AnesthesiologistId, Names.Full(r.Anesthesiologist), r.AssistantId, Names.Full(r.Assistant),
            r.OperatingRoomId, r.OperatingRoom?.Name);
    }

    public static SurgicalReportDetailResponse ToDetail(SurgicalReport r) => new(r.Id, r.Version, r.AttentionId, r.Attention.SurgicalOrderId,
        r.Status, r.SurgeryStartAt, r.SurgeryEndAt, r.SurgeonId, Names.Full(r.Surgeon), r.AnesthesiologistId, Names.Full(r.Anesthesiologist),
        r.AssistantId, Names.Full(r.Assistant), r.OperatingRoomId, r.OperatingRoom?.Name, r.Monitoring, r.Findings,
        r.SurgicalTechniqueDescription, ToSummary(r),
        r.AnestheticProtocol.OrderBy(d => d.Id).Select(d => new AnestheticDrugResponse(d.Id, d.ProductId, d.Product?.Name, d.Phase,
            d.DoseAmount, d.DoseUnit, d.Route)).ToList(),
        r.MaterialsUsed.OrderBy(m => m.Id).Select(m => new SurgicalMaterialResponse(m.Id, m.ProductId, m.Product?.Name,
            m.UnregisteredProductName, m.Quantity, m.UnitType)).ToList(),
        r.PostOperativeIndications.OrderBy(i => i.Id).Select(i => new PostOperativeIndicationResponse(i.Id, i.ProductId, i.Product?.Name,
            i.NonDrugInstruction, i.DoseAmount, i.DoseUnit, i.FrequencyValue, i.FrequencyUnit, i.Route)).ToList());

    public static IQueryable<SurgicalReport> WithSummary(this IQueryable<SurgicalReport> q) => q
        .Include(r => r.Attention).ThenInclude(a => a.Animal)
        .Include(r => r.Attention).ThenInclude(a => a.Branch)
        .Include(r => r.Attention).ThenInclude(a => a.Service)
        .Include(r => r.Surgeon).Include(r => r.Anesthesiologist).Include(r => r.Assistant).Include(r => r.OperatingRoom);

    public static IQueryable<SurgicalReport> Full(this IQueryable<SurgicalReport> q) => q.WithSummary()
        .Include(r => r.AnestheticProtocol).ThenInclude(d => d.Product)
        .Include(r => r.MaterialsUsed).ThenInclude(m => m.Product)
        .Include(r => r.PostOperativeIndications).ThenInclude(i => i.Product)
        .AsSplitQuery();
}

public interface ISurgicalReportService
{
    Task<PaginatedResponse<SurgicalReportSummaryResponse>> ListAsync(IReadOnlyCollection<SurgicalReportStatus>? statuses, long? branchId, long? animalId,
        long? attentionId, long? surgeonId, long? operatingRoomId, DateOnly? startDate, DateOnly? endDate, int page, int size, CancellationToken ct = default);
    Task<SurgicalReportDetailResponse> GetAsync(long id, CancellationToken ct = default);
    Task<SurgicalReportDetailResponse> GetOrCreateByAttentionAsync(long attentionId, CancellationToken ct = default);
    Task<SurgicalReportCreatedResponse> CreateAsync(CreateSurgicalReportRequest r, CancellationToken ct = default);
    Task<SurgicalReportPatchResponse> UpdateAsync(long id, UpdateSurgicalReportRequest r, CancellationToken ct = default);
    Task<SurgicalReportDetailResponse> AddAnestheticDrugAsync(long id, AddSurgicalReportAnestheticDrugRequest r, CancellationToken ct = default);
    Task<SurgicalReportDetailResponse> AddMaterialAsync(long id, AddSurgicalReportMaterialRequest r, CancellationToken ct = default);
    Task<SurgicalReportDetailResponse> AddPostOperativeIndicationAsync(long id, AddSurgicalReportPostOperativeIndicationRequest r, CancellationToken ct = default);
}

public sealed class SurgicalReportService : ISurgicalReportService
{
    private readonly TenantDbContext _db;
    private readonly IInventoryConsumptionService _consumption;

    public SurgicalReportService(TenantDbContext db, IInventoryConsumptionService consumption)
    {
        _db = db;
        _consumption = consumption;
    }

    private async Task<SurgicalReport> RequireAsync(long id, CancellationToken ct) =>
        await _db.SurgicalReports.Full().FirstOrDefaultAsync(r => r.Id == id, ct) ?? throw new InvalidArgumentException("Informe quirúrgico no encontrado: id=" + id);

    private async Task<SurgicalReportDetailResponse> ReloadAsync(long id, CancellationToken ct)
    {
        _db.ChangeTracker.Clear();
        return SurgeryMapping.ToDetail(await _db.SurgicalReports.AsNoTracking().Full().FirstAsync(r => r.Id == id, ct));
    }

    private async Task<Employee> EmployeeAsync(long? id, CancellationToken ct) =>
        await _db.Employees.FirstOrDefaultAsync(e => e.Id == id, ct) ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + id);

    private async Task<OperatingRoom> RoomForAttentionAsync(long? roomId, Attentions attention, CancellationToken ct)
    {
        OperatingRoom room = await _db.OperatingRooms.FirstOrDefaultAsync(o => o.Id == roomId, ct)
            ?? throw new InvalidArgumentException("Sala de operaciones no encontrada: id=" + roomId);
        if (room.BranchId != attention.BranchId)
            throw new InvalidArgumentException("La sala de operaciones pertenece a una sucursal diferente a la atención.");
        return room;
    }

    public async Task<PaginatedResponse<SurgicalReportSummaryResponse>> ListAsync(IReadOnlyCollection<SurgicalReportStatus>? statuses, long? branchId,
        long? animalId, long? attentionId, long? surgeonId, long? operatingRoomId, DateOnly? startDate, DateOnly? endDate, int page, int size,
        CancellationToken ct = default)
    {
        IQueryable<SurgicalReport> query = _db.SurgicalReports.AsNoTracking().WithSummary();
        if (statuses is { Count: > 0 }) query = query.Where(r => statuses.Contains(r.Status));
        if (branchId is not null) query = query.Where(r => r.Attention.BranchId == branchId);
        if (animalId is not null) query = query.Where(r => r.Attention.AnimalId == animalId);
        if (attentionId is not null) query = query.Where(r => r.AttentionId == attentionId);
        if (surgeonId is not null) query = query.Where(r => r.SurgeonId == surgeonId);
        if (operatingRoomId is not null) query = query.Where(r => r.OperatingRoomId == operatingRoomId);
        if (startDate is not null)
        {
            DateTime start = startDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(r => r.SurgeryEndAt == null || r.SurgeryEndAt >= start);
        }
        if (endDate is not null)
        {
            DateTime endExclusive = endDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(r => r.SurgeryStartAt < endExclusive);
        }
        var result = await query.OrderByDescending(r => r.SurgeryStartAt).ThenByDescending(r => r.Id).ToPageAsync(page, size, ct);
        return result.Map(SurgeryMapping.ToSummary);
    }

    public async Task<SurgicalReportDetailResponse> GetAsync(long id, CancellationToken ct = default) =>
        SurgeryMapping.ToDetail(await _db.SurgicalReports.AsNoTracking().Full().FirstOrDefaultAsync(r => r.Id == id, ct)
                                ?? throw new InvalidArgumentException("Informe quirúrgico no encontrado: id=" + id));

    public Task<SurgicalReportDetailResponse> GetOrCreateByAttentionAsync(long attentionId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Attentions attention = await _db.Attentions.FirstOrDefaultAsync(a => a.Id == attentionId, ct)
                ?? throw new InvalidArgumentException("Atención no encontrada: id=" + attentionId);
            if (attention.Type != AttentionType.SURGERY)
                throw new BusinessRuleException("Solo se puede crear un reporte quirúrgico para atenciones de tipo SURGERY. " +
                                                $"Atención {attentionId} es de tipo {attention.Type}");
            await _db.Attentions.Where(a => a.Id == attentionId && a.Status == AttentionsStatus.WAITING)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, AttentionsStatus.IN_PROGRESS), ct);
            await _db.Database.ExecuteSqlRawAsync(
                "INSERT INTO surgical_reports (attention_id, status) VALUES (@attention, @status) ON CONFLICT (attention_id) DO NOTHING",
                new object[] { new Npgsql.NpgsqlParameter("attention", attentionId), new Npgsql.NpgsqlParameter("status", SurgicalReportStatus.DRAFT.ToString()) }, ct);
            long id = await _db.SurgicalReports.Where(r => r.AttentionId == attentionId).Select(r => r.Id).FirstAsync(ct);
            return await ReloadAsync(id, ct);
        }, ct);

    public Task<SurgicalReportCreatedResponse> CreateAsync(CreateSurgicalReportRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Attentions attention = await _db.Attentions.FirstOrDefaultAsync(a => a.Id == r.AttentionId, ct)
                ?? throw new InvalidArgumentException("Atención no encontrada: id=" + r.AttentionId);
            if (attention.Type != AttentionType.SURGERY)
                throw new ValidationFailedException("El reporte quirúrgico solo aplica a atenciones de tipo SURGERY");
            if (await _db.SurgicalReports.AnyAsync(x => x.AttentionId == attention.Id, ct))
                throw new BusinessRuleException("Ya existe un informe quirúrgico para la atención indicada.");
            Employee surgeon = await EmployeeAsync(r.SurgeonId, ct);
            var report = new SurgicalReport
            {
                Attention = attention, SurgeryStartAt = r.SurgeryStartAt, SurgeryEndAt = r.SurgeryEndAt, Surgeon = surgeon,
                Anesthesiologist = r.AnesthesiologistId is null ? null : await EmployeeAsync(r.AnesthesiologistId, ct),
                Assistant = r.AssistantId is null ? null : await EmployeeAsync(r.AssistantId, ct),
                OperatingRoom = await RoomForAttentionAsync(r.OperatingRoomId, attention, ct),
                Status = r.Status ?? SurgicalReportStatus.DRAFT, Monitoring = Text.TrimToNull(r.Monitoring), Findings = Text.TrimToNull(r.Findings),
                SurgicalTechniqueDescription = Text.TrimToNull(r.SurgicalTechniqueDescription),
            };
            _db.SurgicalReports.Add(report);
            await _db.SaveChangesAsync(ct);
            return new SurgicalReportCreatedResponse(report.Id, attention.Id, report.SurgeryStartAt, report.SurgeryEndAt, surgeon.Id, report.Status);
        }, ct);

    public Task<SurgicalReportPatchResponse> UpdateAsync(long id, UpdateSurgicalReportRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            SurgicalReport report = await RequireAsync(id, ct);
            if (report.Version != r.Version) throw new DbUpdateConcurrencyException("Versión desactualizada");
            var updated = new Dictionary<string, object?>();
            if (r.SurgeryStartAt.IsPresent) { report.SurgeryStartAt = r.SurgeryStartAt.Value; updated["surgeryStartAt"] = report.SurgeryStartAt; }
            if (r.SurgeryEndAt.IsPresent) { report.SurgeryEndAt = r.SurgeryEndAt.Value; updated["surgeryEndAt"] = report.SurgeryEndAt; }
            await ApplyEmployeeAsync(updated, "surgeonId", r.SurgeonId, true, e => report.Surgeon = e, ct);
            await ApplyEmployeeAsync(updated, "anesthesiologistId", r.AnesthesiologistId, false, e => report.Anesthesiologist = e, ct);
            await ApplyEmployeeAsync(updated, "assistantId", r.AssistantId, false, e => report.Assistant = e, ct);
            if (r.OperatingRoomId.IsPresent)
            {
                report.OperatingRoom = r.OperatingRoomId.Value is null ? null : await RoomForAttentionAsync(r.OperatingRoomId.Value, report.Attention, ct);
                if (report.OperatingRoom is null) report.OperatingRoomId = null;
                updated["operatingRoomId"] = report.OperatingRoom?.Id;
            }
            if (r.Status.IsPresent) { if (r.Status.Value is { } s) report.Status = s; updated["status"] = report.Status; }
            if (r.Monitoring.IsPresent) { report.Monitoring = Text.TrimToNull(r.Monitoring.Value); updated["monitoring"] = report.Monitoring; }
            if (r.Findings.IsPresent) { report.Findings = Text.TrimToNull(r.Findings.Value); updated["findings"] = report.Findings; }
            if (r.SurgicalTechniqueDescription.IsPresent)
            {
                report.SurgicalTechniqueDescription = Text.TrimToNull(r.SurgicalTechniqueDescription.Value);
                updated["surgicalTechniqueDescription"] = report.SurgicalTechniqueDescription;
            }
            await _db.SaveChangesAsync(ct);
            return new SurgicalReportPatchResponse(report.Id, report.Version, report.Status, updated, SurgeryMapping.ToSummary(report));
        }, ct);

    private async Task ApplyEmployeeAsync(Dictionary<string, object?> updated, string field, Optional<long?> value, bool required,
        Action<Employee?> setter, CancellationToken ct)
    {
        if (!value.IsPresent) return;
        if (value.Value is null)
        {
            if (required) throw new InvalidArgumentException($"El {field} no puede ser nulo.");
            setter(null);
            updated[field] = null;
            return;
        }
        Employee employee = await EmployeeAsync(value.Value, ct);
        setter(employee);
        updated[field] = employee.Id;
    }

    private static void ClearNullFks(SurgicalReport report)
    {
        if (report.Anesthesiologist is null) report.AnesthesiologistId = null;
        if (report.Assistant is null) report.AssistantId = null;
    }

    public Task<SurgicalReportDetailResponse> AddAnestheticDrugAsync(long id, AddSurgicalReportAnestheticDrugRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            SurgicalReport report = await RequireAsync(id, ct);
            Product product = await _db.Products.FirstOrDefaultAsync(p => p.Id == r.ProductId, ct) ?? throw new InvalidArgumentException("Producto no encontrado: id=" + r.ProductId);
            var drug = new AnestheticDrug
            {
                SurgicalReportId = report.Id, Product = product, Phase = r.Phase!.Value, DoseAmount = r.DoseAmount!.Value,
                DoseUnit = r.DoseUnit!.Value, Route = r.Route,
            };
            _db.AnestheticDrugs.Add(drug);
            await _db.SaveChangesAsync(ct);
            await _consumption.ConsumeAsync(product.Id, report.Attention.BranchId, r.DoseAmount, r.DoseUnit, "AnestheticDrug", drug.Id, ct);
            return await ReloadAsync(report.Id, ct);
        }, ct);

    public Task<SurgicalReportDetailResponse> AddMaterialAsync(long id, AddSurgicalReportMaterialRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            SurgicalReport report = await RequireAsync(id, ct);
            Product? product = r.ProductId is null
                ? null
                : await _db.Products.FirstOrDefaultAsync(p => p.Id == r.ProductId, ct) ?? throw new InvalidArgumentException("Producto no encontrado: id=" + r.ProductId);
            var material = new SurgicalMaterial
            {
                SurgicalReportId = report.Id, Product = product, UnregisteredProductName = Text.TrimToNull(r.UnregisteredProductName),
                Quantity = r.Quantity!.Value, UnitType = r.UnitType!.Value,
            };
            _db.SurgicalMaterials.Add(material);
            await _db.SaveChangesAsync(ct);
            if (product is not null)
                await _consumption.ConsumeAsync(product.Id, report.Attention.BranchId, r.Quantity, r.UnitType, "SurgicalMaterial", material.Id, ct);
            return await ReloadAsync(report.Id, ct);
        }, ct);

    public Task<SurgicalReportDetailResponse> AddPostOperativeIndicationAsync(long id, AddSurgicalReportPostOperativeIndicationRequest r,
        CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            SurgicalReport report = await RequireAsync(id, ct);
            Product? product = r.ProductId is null
                ? null
                : await _db.Products.FirstOrDefaultAsync(p => p.Id == r.ProductId, ct) ?? throw new InvalidArgumentException("Producto no encontrado: id=" + r.ProductId);
            _db.PostOperativeIndications.Add(new PostOperativeIndication
            {
                SurgicalReportId = report.Id, Product = product, DoseAmount = r.DoseAmount, DoseUnit = r.DoseUnit, FrequencyValue = r.FrequencyValue,
                FrequencyUnit = r.FrequencyUnit, Route = r.Route, NonDrugInstruction = Text.TrimToNull(r.NonDrugInstruction),
            });
            ClearNullFks(report);
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(report.Id, ct);
        }, ct);
}
