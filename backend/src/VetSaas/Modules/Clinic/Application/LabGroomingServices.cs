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

// =====================================================================================================
// Solicitudes de laboratorio
// =====================================================================================================

public sealed record CreateLaboratoryRequest(long? AnimalId, long? LaboratoryId, long? RequestingEmployeeId, string? ClinicalNotes,
    List<AddClinicalAttentionLaboratoryItem>? Items);

public sealed class CreateLaboratoryRequestValidator : AbstractValidator<CreateLaboratoryRequest>
{
    public CreateLaboratoryRequestValidator()
    {
        RuleFor(r => r.AnimalId).NotNull().WithMessage("El paciente es obligatorio");
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

public sealed record ResultValueItem(long? ParameterId, double? NumericValue, string? TextValue, bool? BooleanValue, string? Comment, string? UnitOverride);
public sealed record AddResultValuesRequest(List<ResultValueItem>? Results);

public sealed class AddResultValuesValidator : AbstractValidator<AddResultValuesRequest>
{
    public AddResultValuesValidator()
    {
        RuleFor(r => r.Results).NotNull().WithMessage("Los resultados son obligatorios");
        RuleForEach(r => r.Results).ChildRules(i => i.RuleFor(x => x.ParameterId).NotNull().WithMessage("El parámetro es obligatorio"));
    }
}

public sealed record UpdateLabRequestStatusRequest(LabRequestStatus? Status);

public sealed class UpdateLabRequestStatusValidator : AbstractValidator<UpdateLabRequestStatusRequest>
{
    public UpdateLabRequestStatusValidator() => RuleFor(r => r.Status).NotNull().WithMessage("El estado es obligatorio");
}

public sealed record LaboratoryRequestSummaryResponse(long Id, long AnimalId, string AnimalName, long LaboratoryId, string LaboratoryName,
    long? RequestingEmployeeId, string? RequestingEmployeeFullName, LabRequestStatus Status, DateTime CreatedAt, string? AnimalSpecies,
    string? AnimalBreed);

public sealed record LaboratoryRequestDetailResponse(long Id, long AnimalId, string AnimalName, long LaboratoryId, string LaboratoryName,
    long? RequestingEmployeeId, string? RequestingEmployeeFullName, LabRequestStatus Status, DateTime CreatedAt, string? AnimalSpecies,
    string? AnimalBreed, string? ClinicalNotes, IReadOnlyList<LaboratoryRequestItemResponse> Items);

public interface ILaboratoryRequestService
{
    Task<PaginatedResponse<LaboratoryRequestSummaryResponse>> ListAsync(IReadOnlyCollection<LabRequestStatus>? statuses, long? branchId, long? animalId,
        long? laboratoryId, long? requestingEmployeeId, DateOnly? startDate, DateOnly? endDate, int page, int size, CancellationToken ct = default);
    Task<LaboratoryRequestDetailResponse> GetAsync(long id, CancellationToken ct = default);
    Task<LaboratoryRequestDetailResponse> CreateAsync(CreateLaboratoryRequest r, CancellationToken ct = default);
    Task<LaboratoryRequestDetailResponse> AddResultsAsync(long itemId, AddResultValuesRequest r, CancellationToken ct = default);
    Task<LaboratoryRequestDetailResponse> UpdateStatusAsync(long id, LabRequestStatus status, CancellationToken ct = default);
}

public sealed class LaboratoryRequestService : ILaboratoryRequestService
{
    private readonly TenantDbContext _db;
    private readonly IClock _clock;

    public LaboratoryRequestService(TenantDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    private IQueryable<LaboratoryRequest> Full() => _db.LaboratoryRequests
        .Include(r => r.Animal).Include(r => r.Laboratory).Include(r => r.RequestingEmployee)
        .Include(r => r.Items).ThenInclude(i => i.Test).ThenInclude(t => t.Parameters)
        .Include(r => r.Items).ThenInclude(i => i.Results).ThenInclude(v => v.Parameter)
        .AsSplitQuery();

    private static LaboratoryRequestDetailResponse ToDetail(LaboratoryRequest r) => new(r.Id, r.AnimalId, r.Animal.Name, r.LaboratoryId,
        r.Laboratory.Name, r.RequestingEmployeeId, r.RequestingEmployee is null ? null : r.RequestingEmployee.FirstName + " " + r.RequestingEmployee.LastName,
        r.Status, r.CreatedAt, null, null, r.ClinicalNotes, r.Items.OrderBy(i => i.Id).Select(LaboratoryRequestItemResponse.Full).ToList());

    private async Task<LaboratoryRequestDetailResponse> ReloadAsync(long id, CancellationToken ct)
    {
        _db.ChangeTracker.Clear();
        return ToDetail(await Full().AsNoTracking().FirstAsync(r => r.Id == id, ct));
    }

    public async Task<PaginatedResponse<LaboratoryRequestSummaryResponse>> ListAsync(IReadOnlyCollection<LabRequestStatus>? statuses, long? branchId,
        long? animalId, long? laboratoryId, long? requestingEmployeeId, DateOnly? startDate, DateOnly? endDate, int page, int size,
        CancellationToken ct = default)
    {
        IQueryable<LaboratoryRequest> query = _db.LaboratoryRequests.AsNoTracking();
        if (statuses is { Count: > 0 }) query = query.Where(r => statuses.Contains(r.Status));
        if (branchId is > 0) query = query.Where(r => r.Laboratory.BranchId == branchId);
        if (animalId is > 0) query = query.Where(r => r.AnimalId == animalId);
        if (laboratoryId is > 0) query = query.Where(r => r.LaboratoryId == laboratoryId);
        if (requestingEmployeeId is > 0) query = query.Where(r => r.RequestingEmployeeId == requestingEmployeeId);
        if (startDate is not null)
        {
            DateTime from = startDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(r => r.CreatedAt >= from);
        }
        if (endDate is not null)
        {
            DateTime to = endDate.Value.ToDateTime(new TimeOnly(23, 59, 59));
            query = query.Where(r => r.CreatedAt <= to);
        }
        var rows = await query.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.Id)
            .Select(r => new
            {
                r.Id, r.AnimalId, AnimalName = r.Animal.Name, r.Animal.Species, r.Animal.Breed, r.LaboratoryId, LabName = r.Laboratory.Name,
                r.RequestingEmployeeId, Emp = r.RequestingEmployee != null ? r.RequestingEmployee.FirstName + " " + r.RequestingEmployee.LastName : null,
                r.Status, r.CreatedAt,
            }).ToPageAsync(page, size, ct);
        return rows.Map(r => new LaboratoryRequestSummaryResponse(r.Id, r.AnimalId, r.AnimalName, r.LaboratoryId, r.LabName,
            r.RequestingEmployeeId, r.Emp, r.Status, r.CreatedAt, r.Species.ToString(), r.Breed));
    }

    public async Task<LaboratoryRequestDetailResponse> GetAsync(long id, CancellationToken ct = default) =>
        ToDetail(await Full().AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct)
                 ?? throw new InvalidArgumentException("Solicitud de laboratorio no encontrada: id=" + id));

    public Task<LaboratoryRequestDetailResponse> CreateAsync(CreateLaboratoryRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            var animal = await _db.Animals.FirstOrDefaultAsync(a => a.Id == r.AnimalId, ct) ?? throw new InvalidArgumentException("Animal no encontrado: id=" + r.AnimalId);
            var lab = await _db.Laboratories.FirstOrDefaultAsync(l => l.Id == r.LaboratoryId, ct) ?? throw new InvalidArgumentException("Laboratorio no encontrado: id=" + r.LaboratoryId);
            Employee? requesting = r.RequestingEmployeeId is null
                ? null
                : await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.RequestingEmployeeId, ct)
                  ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + r.RequestingEmployeeId);
            var request = new LaboratoryRequest
            {
                Animal = animal, Laboratory = lab, RequestingEmployee = requesting, Status = LabRequestStatus.REQUESTED,
                CreatedAt = _clock.Now, ClinicalNotes = r.ClinicalNotes,
            };
            foreach (AddClinicalAttentionLaboratoryItem i in r.Items!)
            {
                LaboratoryTest test = await _db.LaboratoryTests.FirstOrDefaultAsync(t => t.Id == i.TestId, ct)
                    ?? throw new InvalidArgumentException("Prueba de laboratorio no encontrada: id=" + i.TestId);
                request.Items.Add(new LaboratoryRequestItem
                {
                    LaboratoryRequest = request, Test = test, Status = LabRequestItemStatus.REQUESTED, UnitPrice = i.UnitPrice!.Value,
                    Quantity = i.Quantity!.Value, Subtotal = i.UnitPrice!.Value * i.Quantity!.Value, Notes = i.Notes,
                });
            }
            _db.LaboratoryRequests.Add(request);
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(request.Id, ct);
        }, ct);

    /// <summary>
    /// Guarda (o corrige) los resultados por parámetro según su tipo, marca fuera de rango a los numéricos y actualiza el estado:
    /// todos con resultado → WITH_RESULTS; alguno → IN_PROCESS. Con todos los exámenes con resultado, la solicitud queda COMPLETED.
    /// </summary>
    public Task<LaboratoryRequestDetailResponse> AddResultsAsync(long itemId, AddResultValuesRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            LaboratoryRequestItem item = await _db.LaboratoryRequestItems
                                             .Include(i => i.Test).ThenInclude(t => t.Parameters)
                                             .Include(i => i.Results)
                                             .FirstOrDefaultAsync(i => i.Id == itemId, ct)
                                         ?? throw new InvalidArgumentException("Item de solicitud de laboratorio no encontrado: id=" + itemId);
            var parameters = item.Test.Parameters.ToDictionary(p => p.Id);
            var byParam = item.Results.ToDictionary(v => v.ParameterId);

            foreach (ResultValueItem rv in r.Results!)
            {
                long paramId = rv.ParameterId!.Value;
                if (!parameters.TryGetValue(paramId, out LaboratoryTestParameter? parameter))
                    throw new InvalidArgumentException("El parámetro no pertenece a la prueba del item: parameterId=" + paramId);
                if (!byParam.TryGetValue(paramId, out LaboratoryResultValue? value))
                {
                    value = new LaboratoryResultValue { RequestItem = item, Parameter = parameter, ParameterId = paramId };
                    item.Results.Add(value);
                    byParam[paramId] = value;
                }
                value.NumericValue = null;
                value.TextValue = null;
                value.BooleanValue = null;
                switch (parameter.ValueType)
                {
                    case LabValueType.NUMERIC:
                        value.NumericValue = rv.NumericValue;
                        if (rv.NumericValue is { } v)
                        {
                            bool? outOfRange = null;
                            string? flag = null;
                            if (parameter.RefMin is { } min && v < min) { outOfRange = true; flag = "BAJO"; }
                            else if (parameter.RefMax is { } max && v > max) { outOfRange = true; flag = "ALTO"; }
                            else if (parameter.RefMin is not null || parameter.RefMax is not null) outOfRange = false;
                            value.OutOfRange = outOfRange;
                            value.Flag = flag;
                        }
                        break;
                    case LabValueType.TEXT:
                        if (!string.IsNullOrWhiteSpace(rv.TextValue)) value.TextValue = rv.TextValue.Trim();
                        break;
                    case LabValueType.SELECT:
                        if (!string.IsNullOrWhiteSpace(rv.TextValue))
                        {
                            string chosen = rv.TextValue.Trim();
                            if (!string.IsNullOrWhiteSpace(parameter.AllowedOptions))
                            {
                                var options = parameter.AllowedOptions.Split(',').Select(o => o.Trim()).Where(o => o.Length > 0).ToHashSet();
                                if (!options.Contains(chosen)) throw new InvalidArgumentException("Opción inválida para SELECT: " + chosen);
                            }
                            value.TextValue = chosen;
                        }
                        break;
                    case LabValueType.BOOLEAN:
                        if (rv.BooleanValue is not null) value.BooleanValue = rv.BooleanValue;
                        break;
                }
                value.UnitOverride = string.IsNullOrWhiteSpace(rv.UnitOverride) ? null : rv.UnitOverride.Trim();
                value.Comment = rv.Comment;
            }

            bool any = false, all = true;
            foreach (LaboratoryTestParameter p in item.Test.Parameters)
            {
                bool has = byParam.TryGetValue(p.Id, out var v) &&
                           (v.NumericValue is not null || !string.IsNullOrWhiteSpace(v.TextValue) || v.BooleanValue is not null);
                any |= has;
                all &= has;
            }
            item.Status = all ? LabRequestItemStatus.WITH_RESULTS : any ? LabRequestItemStatus.IN_PROCESS : LabRequestItemStatus.REQUESTED;
            await _db.SaveChangesAsync(ct);

            LaboratoryRequest parent = await _db.LaboratoryRequests.Include(x => x.Items).FirstAsync(x => x.Id == item.LaboratoryRequestId, ct);
            if (parent.Items.All(i => i.Status == LabRequestItemStatus.WITH_RESULTS))
            {
                parent.Status = LabRequestStatus.COMPLETED;
                await _db.SaveChangesAsync(ct);
            }
            return await ReloadAsync(parent.Id, ct);
        }, ct);

    public Task<LaboratoryRequestDetailResponse> UpdateStatusAsync(long id, LabRequestStatus status, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            LaboratoryRequest request = await _db.LaboratoryRequests.FirstOrDefaultAsync(r => r.Id == id, ct)
                ?? throw new InvalidArgumentException("Solicitud de laboratorio no encontrada: id=" + id);
            if (request.Status == LabRequestStatus.CANCELED)
                throw new BusinessRuleException("No se puede cambiar el estado de una solicitud cancelada.");
            request.Status = status;
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(id, ct);
        }, ct);
}

// =====================================================================================================
// Peluquería
// =====================================================================================================

public sealed record CreateGroomingSessionRequest(long? AttentionId, DateTime? StartedAt, DateTime? FinishedAt, long? AssignedProfessionalId,
    decimal? ChargedPrice, string? BehaviorNotes, string? ClinicalObservations, GroomingStatus? Status);

public sealed class CreateGroomingSessionValidator : AbstractValidator<CreateGroomingSessionRequest>
{
    public CreateGroomingSessionValidator()
    {
        RuleFor(r => r.AttentionId).NotNull().WithMessage("La atención es obligatoria");
        RuleFor(r => r.StartedAt).NotNull().WithMessage("La hora de inicio es obligatoria");
    }
}

public sealed record UpdateGroomingSessionRequest(uint? Version, Optional<DateTime?> StartedAt, Optional<DateTime?> FinishedAt,
    Optional<long?> AssignedProfessionalId, Optional<decimal?> ChargedPrice, Optional<GroomingStatus?> Status, Optional<string?> BehaviorNotes,
    Optional<string?> ClinicalObservations);

public sealed record AddGroomingMaterialRequest(long? ProductId, string? UnregisteredProductName, decimal? Quantity, ProductUnitType? UnitType,
    decimal? UnitPrice);

public sealed class AddGroomingMaterialValidator : AbstractValidator<AddGroomingMaterialRequest>
{
    public AddGroomingMaterialValidator()
    {
        RuleFor(r => r.Quantity).NotNull().WithMessage("La cantidad es obligatoria");
        RuleFor(r => r.UnitType).NotNull().WithMessage("La unidad es obligatoria");
        RuleFor(r => r).Must(r => (r.ProductId is not null) ^ !string.IsNullOrWhiteSpace(r.UnregisteredProductName))
            .WithMessage("Debe especificarse un productId o un unregisteredProductName, pero no ambos.");
    }
}

public sealed record GroomingMaterialResponse(long Id, long? ProductId, string? ProductName, string? UnregisteredProductName, decimal Quantity,
    ProductUnitType UnitType, decimal? UnitPrice, decimal? Subtotal);

public sealed record GroomingSessionSummaryResponse(long Id, uint Version, long AttentionId, DateTime? StartedAt, DateTime? FinishedAt,
    GroomingStatus Status, AnimalBasicResponse? AnimalBasicResponse, string? ServiceName, BranchResponse? Branch, long? AssignedProfessionalId,
    string? AssignedProfessionalFullName, decimal? ChargedPrice);

public sealed record GroomingSessionDetailResponse(long Id, uint Version, long AttentionId, GroomingStatus Status, DateTime? StartedAt,
    DateTime? FinishedAt, long? AssignedProfessionalId, string? AssignedProfessionalFullName, decimal? ChargedPrice, string? BehaviorNotes,
    string? ClinicalObservations, GroomingSessionSummaryResponse Summary, IReadOnlyList<GroomingMaterialResponse> MaterialsUsed,
    IReadOnlyList<string> PhotoUrls);

public sealed record GroomingSessionCreatedResponse(long GroomingSessionId, long AttentionId, DateTime? StartedAt, DateTime? FinishedAt,
    long? AssignedProfessionalId, GroomingStatus Status);

public sealed record GroomingSessionPatchResponse(long Id, uint Version, GroomingStatus Status, IReadOnlyDictionary<string, object?> Updated,
    GroomingSessionSummaryResponse Summary);

internal static class GroomingMapping
{
    public static GroomingSessionSummaryResponse ToSummary(GroomingSession s)
    {
        Attentions a = s.Attention;
        return new GroomingSessionSummaryResponse(s.Id, s.Version, a.Id, s.StartedAt, s.FinishedAt, s.Status,
            a.Animal is null ? null : AnimalBasicResponse.From(a.Animal), a.Service?.Name, Names.Branch(a.Branch), s.AssignedProfessionalId,
            Names.Full(s.AssignedProfessional), s.ChargedPrice);
    }

    public static GroomingSessionDetailResponse ToDetail(GroomingSession s) => new(s.Id, s.Version, s.AttentionId, s.Status, s.StartedAt,
        s.FinishedAt, s.AssignedProfessionalId, Names.Full(s.AssignedProfessional), s.ChargedPrice, s.BehaviorNotes, s.ClinicalObservations,
        ToSummary(s), s.MaterialsUsed.OrderBy(m => m.Id).Select(m => new GroomingMaterialResponse(m.Id, m.ProductId, m.Product?.Name,
            m.UnregisteredProductName, m.Quantity, m.UnitType, m.UnitPrice, m.Subtotal)).ToList(), s.PhotoUrls.ToList());

    public static IQueryable<GroomingSession> WithSummary(this IQueryable<GroomingSession> q) => q
        .Include(s => s.Attention).ThenInclude(a => a.Animal)
        .Include(s => s.Attention).ThenInclude(a => a.Branch)
        .Include(s => s.Attention).ThenInclude(a => a.Service)
        .Include(s => s.AssignedProfessional);

    public static IQueryable<GroomingSession> Full(this IQueryable<GroomingSession> q) =>
        q.WithSummary().Include(s => s.MaterialsUsed).ThenInclude(m => m.Product).AsSplitQuery();
}

public interface IGroomingSessionService
{
    Task<PaginatedResponse<GroomingSessionSummaryResponse>> ListAsync(IReadOnlyCollection<GroomingStatus>? statuses, long? branchId, long? animalId,
        long? attentionId, long? assignedProfessionalId, DateOnly? startDate, DateOnly? endDate, int page, int size, CancellationToken ct = default);
    Task<GroomingSessionDetailResponse> GetAsync(long id, CancellationToken ct = default);
    Task<GroomingSessionDetailResponse> GetOrCreateByAttentionAsync(long attentionId, CancellationToken ct = default);
    Task<GroomingSessionCreatedResponse> CreateAsync(CreateGroomingSessionRequest r, CancellationToken ct = default);
    Task<GroomingSessionPatchResponse> UpdateAsync(long id, UpdateGroomingSessionRequest r, CancellationToken ct = default);
    Task<GroomingSessionDetailResponse> AddMaterialAsync(long id, AddGroomingMaterialRequest r, CancellationToken ct = default);
}

public sealed class GroomingSessionService : IGroomingSessionService
{
    private readonly TenantDbContext _db;
    private readonly IInventoryConsumptionService _consumption;

    public GroomingSessionService(TenantDbContext db, IInventoryConsumptionService consumption)
    {
        _db = db;
        _consumption = consumption;
    }

    private async Task<GroomingSession> RequireAsync(long id, CancellationToken ct) =>
        await _db.GroomingSessions.Full().FirstOrDefaultAsync(s => s.Id == id, ct) ?? throw new InvalidArgumentException("GroomingSession no encontrada: id=" + id);

    private async Task<GroomingSessionDetailResponse> ReloadAsync(long id, CancellationToken ct)
    {
        _db.ChangeTracker.Clear();
        return GroomingMapping.ToDetail(await _db.GroomingSessions.AsNoTracking().Full().FirstAsync(s => s.Id == id, ct));
    }

    public async Task<PaginatedResponse<GroomingSessionSummaryResponse>> ListAsync(IReadOnlyCollection<GroomingStatus>? statuses, long? branchId,
        long? animalId, long? attentionId, long? assignedProfessionalId, DateOnly? startDate, DateOnly? endDate, int page, int size,
        CancellationToken ct = default)
    {
        IQueryable<GroomingSession> query = _db.GroomingSessions.AsNoTracking().WithSummary();
        if (statuses is { Count: > 0 }) query = query.Where(s => statuses.Contains(s.Status));
        if (branchId is not null) query = query.Where(s => s.Attention.BranchId == branchId);
        if (animalId is not null) query = query.Where(s => s.Attention.AnimalId == animalId);
        if (attentionId is not null) query = query.Where(s => s.AttentionId == attentionId);
        if (assignedProfessionalId is not null) query = query.Where(s => s.AssignedProfessionalId == assignedProfessionalId);
        if (startDate is not null)
        {
            DateTime start = startDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(s => s.FinishedAt == null || s.FinishedAt >= start);
        }
        if (endDate is not null)
        {
            DateTime endExclusive = endDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(s => s.StartedAt < endExclusive);
        }
        var result = await query.OrderByDescending(s => s.StartedAt).ThenByDescending(s => s.Id).ToPageAsync(page, size, ct);
        return result.Map(GroomingMapping.ToSummary);
    }

    public async Task<GroomingSessionDetailResponse> GetAsync(long id, CancellationToken ct = default) =>
        GroomingMapping.ToDetail(await _db.GroomingSessions.AsNoTracking().Full().FirstOrDefaultAsync(s => s.Id == id, ct)
                                 ?? throw new InvalidArgumentException("GroomingSession no encontrada: id=" + id));

    public Task<GroomingSessionDetailResponse> GetOrCreateByAttentionAsync(long attentionId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Attentions attention = await _db.Attentions.FirstOrDefaultAsync(a => a.Id == attentionId, ct)
                ?? throw new InvalidArgumentException("Atención no encontrada: id=" + attentionId);
            if (attention.Type != AttentionType.GROOMING)
                throw new BusinessRuleException("Solo se puede crear una sesión de grooming para atenciones de tipo GROOMING. " +
                                                $"Atención {attentionId} es de tipo {attention.Type}");
            await _db.Attentions.Where(a => a.Id == attentionId && a.Status == AttentionsStatus.WAITING)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, AttentionsStatus.IN_PROGRESS), ct);
            await _db.Database.ExecuteSqlRawAsync(
                "INSERT INTO grooming_sessions (attention_id, status, photo_urls) VALUES (@attention, @status, '{}') ON CONFLICT (attention_id) DO NOTHING",
                new object[] { new Npgsql.NpgsqlParameter("attention", attentionId), new Npgsql.NpgsqlParameter("status", GroomingStatus.DRAFT.ToString()) }, ct);
            long id = await _db.GroomingSessions.Where(s => s.AttentionId == attentionId).Select(s => s.Id).FirstAsync(ct);
            return await ReloadAsync(id, ct);
        }, ct);

    public Task<GroomingSessionCreatedResponse> CreateAsync(CreateGroomingSessionRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Attentions attention = await _db.Attentions.FirstOrDefaultAsync(a => a.Id == r.AttentionId, ct)
                ?? throw new InvalidArgumentException("Atención no encontrada: id=" + r.AttentionId);
            if (attention.Type != AttentionType.GROOMING)
                throw new ValidationFailedException("La sesión de grooming solo aplica a atenciones de tipo GROOMING");
            if (await _db.GroomingSessions.AnyAsync(s => s.AttentionId == attention.Id, ct))
                throw new BusinessRuleException("Ya existe una sesión de grooming para la atención indicada.");
            Employee? professional = r.AssignedProfessionalId is null
                ? null
                : await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.AssignedProfessionalId, ct)
                  ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + r.AssignedProfessionalId);
            var session = new GroomingSession
            {
                Attention = attention, StartedAt = r.StartedAt, FinishedAt = r.FinishedAt, AssignedProfessional = professional,
                ChargedPrice = r.ChargedPrice, Status = r.Status ?? GroomingStatus.DRAFT, BehaviorNotes = Text.TrimToNull(r.BehaviorNotes),
                ClinicalObservations = Text.TrimToNull(r.ClinicalObservations),
            };
            _db.GroomingSessions.Add(session);
            await _db.SaveChangesAsync(ct);
            return new GroomingSessionCreatedResponse(session.Id, attention.Id, session.StartedAt, session.FinishedAt, professional?.Id, session.Status);
        }, ct);

    public Task<GroomingSessionPatchResponse> UpdateAsync(long id, UpdateGroomingSessionRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            GroomingSession s = await RequireAsync(id, ct);
            if (s.Version != r.Version) throw new DbUpdateConcurrencyException("Versión desactualizada");
            var updated = new Dictionary<string, object?>();
            if (r.StartedAt.IsPresent) { s.StartedAt = r.StartedAt.Value; updated["startedAt"] = s.StartedAt; }
            if (r.FinishedAt.IsPresent) { s.FinishedAt = r.FinishedAt.Value; updated["finishedAt"] = s.FinishedAt; }
            if (r.AssignedProfessionalId.IsPresent)
            {
                if (r.AssignedProfessionalId.Value is null) { s.AssignedProfessional = null; s.AssignedProfessionalId = null; }
                else s.AssignedProfessional = await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.AssignedProfessionalId.Value, ct)
                                              ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + r.AssignedProfessionalId.Value);
                updated["assignedProfessionalId"] = s.AssignedProfessional?.Id;
            }
            if (r.Status.IsPresent) { if (r.Status.Value is { } st) s.Status = st; updated["status"] = s.Status; }
            if (r.ChargedPrice.IsPresent) { s.ChargedPrice = r.ChargedPrice.Value; updated["chargedPrice"] = s.ChargedPrice; }
            if (r.BehaviorNotes.IsPresent) { s.BehaviorNotes = Text.TrimToNull(r.BehaviorNotes.Value); updated["behaviorNotes"] = s.BehaviorNotes; }
            if (r.ClinicalObservations.IsPresent)
            {
                s.ClinicalObservations = Text.TrimToNull(r.ClinicalObservations.Value);
                updated["clinicalObservations"] = s.ClinicalObservations;
            }
            await _db.SaveChangesAsync(ct);
            return new GroomingSessionPatchResponse(s.Id, s.Version, s.Status, updated, GroomingMapping.ToSummary(s));
        }, ct);

    public Task<GroomingSessionDetailResponse> AddMaterialAsync(long id, AddGroomingMaterialRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            GroomingSession s = await RequireAsync(id, ct);
            Product? product = r.ProductId is null
                ? null
                : await _db.Products.FirstOrDefaultAsync(p => p.Id == r.ProductId, ct) ?? throw new InvalidArgumentException("Producto no encontrado: id=" + r.ProductId);
            var material = new GroomingMaterialUsed
            {
                GroomingSessionId = s.Id, Product = product, UnregisteredProductName = Text.TrimToNull(r.UnregisteredProductName),
                Quantity = r.Quantity!.Value, UnitType = r.UnitType!.Value, UnitPrice = r.UnitPrice,
                Subtotal = r.UnitPrice is null ? null : r.UnitPrice * r.Quantity,
            };
            _db.GroomingMaterialsUsed.Add(material);
            await _db.SaveChangesAsync(ct);
            if (product is not null)
            {
                if (r.Quantity <= 0) throw new BadRequestException("La cantidad del material debe ser mayor a cero");
                await _consumption.ConsumeAsync(product.Id, s.Attention.BranchId, r.Quantity, r.UnitType, "GroomingMaterialUsed", material.Id, ct);
            }
            return await ReloadAsync(s.Id, ct);
        }, ct);
}

/// <summary>Las sesiones de peluquería listas para entregar y con precio se cobran como servicio en una venta.</summary>
public sealed class GroomingSessionBillableAdapter : IBillableServiceAdapter
{
    private readonly TenantDbContext _db;

    public GroomingSessionBillableAdapter(TenantDbContext db) => _db = db;

    public BillableServiceType SupportsType => BillableServiceType.GROOMING_SESSION;

    private BillableServiceItem ToBillable(GroomingSession s) => new(SupportsType, s.Id, s.Attention.BranchId,
        "Peluquería — " + s.Attention.Animal.Name, s.ChargedPrice, 1m, null, null);

    private IQueryable<GroomingSession> Sessions() => _db.GroomingSessions.Include(s => s.Attention).ThenInclude(a => a.Animal);

    public async Task<BillableServiceItem> GetBillableItemAsync(long itemId, CancellationToken ct)
    {
        GroomingSession s = await Sessions().FirstOrDefaultAsync(x => x.Id == itemId, ct) ?? throw new NotFoundException("Sesión de peluquería no encontrada");
        if (s.SaleDetailId is not null) throw new BadRequestException($"La sesión de peluquería #{itemId} ya fue cobrada en otra venta");
        if (s.Status != GroomingStatus.READY_FOR_PICKUP) throw new BadRequestException("La sesión de peluquería aún no está lista para cobrar");
        if (s.ChargedPrice is null or <= 0) throw new BadRequestException("La sesión de peluquería no tiene un precio definido");
        return ToBillable(s);
    }

    public async Task MarkAsBilledAsync(long itemId, long saleDetailId, CancellationToken ct)
    {
        GroomingSession s = await _db.GroomingSessions.FirstOrDefaultAsync(x => x.Id == itemId, ct) ?? throw new NotFoundException("Sesión de peluquería no encontrada");
        if (s.SaleDetailId is not null && s.SaleDetailId != saleDetailId)
            throw new BadRequestException($"La sesión de peluquería #{itemId} ya fue cobrada en otra venta");
        s.SaleDetailId = saleDetailId;
        await _db.SaveChangesAsync(ct);
    }

    public async Task MarkAsUnbilledAsync(long itemId, CancellationToken ct)
    {
        GroomingSession? s = await _db.GroomingSessions.FirstOrDefaultAsync(x => x.Id == itemId, ct);
        if (s is null) return;
        s.SaleDetailId = null;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<BillableServiceItem>> ListPendingAsync(long? branchId, long? attentionId, long? patientId, string? query, CancellationToken ct)
    {
        IQueryable<GroomingSession> q = Sessions().AsNoTracking()
            .Where(s => s.SaleDetailId == null && s.Status == GroomingStatus.READY_FOR_PICKUP && s.ChargedPrice != null && s.ChargedPrice > 0);
        if (branchId is not null) q = q.Where(s => s.Attention.BranchId == branchId);
        if (attentionId is not null) q = q.Where(s => s.AttentionId == attentionId);
        if (patientId is not null) q = q.Where(s => s.Attention.AnimalId == patientId);
        if (query is not null) q = q.Where(s => EF.Functions.ILike(s.Attention.Animal.Name, $"%{query}%"));
        return (await q.OrderByDescending(s => s.FinishedAt).ThenBy(s => s.Id).ToListAsync(ct)).Select(ToBillable).ToList();
    }
}
