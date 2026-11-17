using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Modules.Customers.Application;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Inventory.Application;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Clinic.Application;

// ---- DTOs ----

public sealed record CageRequest(string? Name, CageSize? Size, long? BranchId);

public sealed class CageRequestValidator : AbstractValidator<CageRequest>
{
    public CageRequestValidator()
    {
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no puede estar vacío");
        RuleFor(r => r.Size).NotNull().WithMessage("El tamaño no puede estar vacío");
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sucursal es obligatoria");
    }
}

public sealed record CreateHospitalizationRequest(long? AnimalId, long? CageId, long? AttentionId, AdmissionTiming? AdmissionTiming,
    HospitalizationCause? Cause, long? ClinicalServiceId, string? AdmissionNotes);

public sealed class CreateHospitalizationValidator : AbstractValidator<CreateHospitalizationRequest>
{
    public CreateHospitalizationValidator()
    {
        RuleFor(r => r.AnimalId).NotNull().WithMessage("El paciente es obligatorio");
        RuleFor(r => r.CageId).NotNull().WithMessage("La jaula es obligatoria");
        RuleFor(r => r.AdmissionTiming).NotNull().WithMessage("El momento de ingreso es obligatorio");
        RuleFor(r => r.AdmissionNotes).NotEmpty().WithMessage("Las notas de ingreso son obligatorias");
    }
}

public sealed record UpdateHospitalizationRequest(uint? Version, DateTime? DischargeDate, string? AdmissionNotes,
    HospitalizationStatus? Status, HospitalizationCause? Cause, long? ClinicalServiceId);

public sealed class UpdateHospitalizationValidator : AbstractValidator<UpdateHospitalizationRequest>
{
    public UpdateHospitalizationValidator() => RuleFor(r => r.Version).NotNull().WithMessage("La versión es obligatoria");
}

public sealed record AddEvolutionNoteRequest(long? AuthorId, string? Note);

public sealed class AddEvolutionNoteValidator : AbstractValidator<AddEvolutionNoteRequest>
{
    public AddEvolutionNoteValidator()
    {
        RuleFor(r => r.AuthorId).NotNull().WithMessage("El autor es obligatorio");
        RuleFor(r => r.Note).NotEmpty().WithMessage("La nota no debe estar vacía");
    }
}

public sealed record CreateHospitalizationVitalSignRequest(long? RecordedByEmployeeId, DateTime? RecordedAt, double? WeightKg,
    double? TemperatureCelsius, int? HeartRate, int? RespiratoryRate);

public sealed class CreateHospitalizationVitalSignValidator : AbstractValidator<CreateHospitalizationVitalSignRequest>
{
    public CreateHospitalizationVitalSignValidator()
    {
        RuleFor(r => r.RecordedByEmployeeId).NotNull().WithMessage("El responsable es obligatorio");
        RuleFor(r => r.WeightKg).GreaterThan(0).When(r => r.WeightKg is not null).WithMessage("El peso debe ser mayor que cero.");
        RuleFor(r => r.TemperatureCelsius).GreaterThan(0).When(r => r.TemperatureCelsius is not null).WithMessage("La temperatura debe ser mayor que cero.");
        RuleFor(r => r.HeartRate).GreaterThanOrEqualTo(1).When(r => r.HeartRate is not null).WithMessage("La frecuencia cardiaca debe ser mayor que cero.");
        RuleFor(r => r.RespiratoryRate).GreaterThanOrEqualTo(1).When(r => r.RespiratoryRate is not null).WithMessage("La frecuencia respiratoria debe ser mayor que cero.");
    }
}

public sealed record CreateTreatmentScheduleRequest(string? TreatmentName, DateTime? ScheduledTime, string? Notes, int? FrequencyValue,
    FrequencyUnit? FrequencyUnit, int? NumberOfDoses);

public sealed class CreateTreatmentScheduleValidator : AbstractValidator<CreateTreatmentScheduleRequest>
{
    public CreateTreatmentScheduleValidator()
    {
        RuleFor(r => r.TreatmentName).NotEmpty().WithMessage("Treatment name is required");
        RuleFor(r => r.ScheduledTime).NotNull().WithMessage("Scheduled time is required");
    }
}

public sealed record TreatmentScheduleProductUsageRequest(long? ProductId, decimal? Quantity, ProductUnitType? Unit);

public sealed record UpdateTreatmentScheduleRequest(bool? IsCompleted, long? CompletedByEmployeeId, string? Notes,
    List<TreatmentScheduleProductUsageRequest>? Products);

public sealed class UpdateTreatmentScheduleValidator : AbstractValidator<UpdateTreatmentScheduleRequest>
{
    public UpdateTreatmentScheduleValidator()
    {
        RuleFor(r => r.IsCompleted).NotNull().WithMessage("El estado de cumplimiento es obligatorio");
        RuleForEach(r => r.Products).ChildRules(p =>
        {
            p.RuleFor(x => x.ProductId).NotNull().WithMessage("El producto es obligatorio");
            p.RuleFor(x => x.Quantity).NotNull().WithMessage("La cantidad es obligatoria")
                .GreaterThanOrEqualTo(0.0001m).WithMessage("La cantidad debe ser mayor que cero");
            p.RuleFor(x => x.Unit).NotNull().WithMessage("La unidad es obligatoria");
        });
    }
}

public sealed record EvolutionNoteResponse(long Id, long HospitalizationId, long? AuthorId, string? AuthorFullName, DateTime Timestamp, string Note)
{
    public static EvolutionNoteResponse From(EvolutionNote n) => new(n.Id, n.HospitalizationId, n.AuthorId,
        n.Author is null ? null : n.Author.FirstName + " " + n.Author.LastName, n.Timestamp, n.Note);
}

public sealed record HospitalizationVitalSignResponse(long Id, long HospitalizationId, double? WeightKg, double? TemperatureCelsius,
    int? HeartRate, int? RespiratoryRate, DateTime RecordedAt, long? RecordedByEmployeeId, string? RecordedByEmployeeFullName)
{
    public static HospitalizationVitalSignResponse From(HospitalizationVitalSign v) => new(v.Id, v.HospitalizationId, v.WeightKg,
        v.TemperatureCelsius, v.HeartRate, v.RespiratoryRate, v.RecordedAt, v.RecordedById,
        v.RecordedBy is null ? null : v.RecordedBy.FirstName + " " + v.RecordedBy.LastName);
}

public sealed record TreatmentScheduleBriefResponse(long Id, string TreatmentName, DateTime ScheduledTime, bool Completed);

public sealed record TreatmentScheduleProductUsageResponse(long Id, long ProductId, string? ProductName, decimal Quantity, ProductUnitType Unit);

/// <summary>El backend anterior enviaba el cumplimiento como «isCompleted» y también como «completed».</summary>
public sealed record TreatmentScheduleResponse(long Id, long HospitalizationId, string TreatmentName, DateTime ScheduledTime,
    [property: JsonPropertyName("isCompleted")] bool IsCompleted, DateTime? CompletedAt, long? CompletedByEmployeeId,
    string? CompletedByEmployeeFullName, string? Notes, IReadOnlyList<TreatmentScheduleProductUsageResponse> Products)
{
    public bool Completed => IsCompleted;

    public static TreatmentScheduleResponse From(TreatmentSchedule s) => new(s.Id, s.HospitalizationId, s.TreatmentName, s.ScheduledTime,
        s.IsCompleted, s.CompletedAt, s.CompletedById, s.CompletedBy is null ? null : s.CompletedBy.FirstName + " " + s.CompletedBy.LastName,
        s.Notes, s.ProductUsages.OrderBy(u => u.Id).Select(u => new TreatmentScheduleProductUsageResponse(u.Id, u.ProductId,
            u.Product?.Name, u.Quantity, u.Unit)).ToList());
}

public sealed record HospitalizationResponse(long Id, long AnimalId, string? AnimalName, long CageId, string? CageName, long? AttentionId,
    long? ClinicalServiceId, string? ClinicalServiceName, AdmissionTiming AdmissionTiming, HospitalizationCause? Cause, DateTime AdmissionDate,
    DateTime? DischargeDate, string? AdmissionNotes, HospitalizationStatus Status, IReadOnlyList<EvolutionNoteResponse> EvolutionNotes,
    IReadOnlyList<TreatmentScheduleResponse> TreatmentSchedules, IReadOnlyList<HospitalizationVitalSignResponse> VitalSigns, uint Version);

public sealed record HospitalizationSummaryResponse(long Id, long AnimalId, string AnimalName, long CageId, string CageName, long BranchId,
    string BranchName, DateTime AdmissionDate, HospitalizationStatus Status, AdmissionTiming AdmissionTiming, HospitalizationCause? Cause,
    long? ClinicalServiceId, string? ClinicalServiceName, uint Version);

public sealed record HospitalizationPatchResponse(long Id, uint Version, HospitalizationStatus Status, IReadOnlyDictionary<string, object?> Updated);

public sealed record CurrentHospitalizationBrief(long Id, AnimalBasicResponse AnimalBasicResponse, HospitalizationStatus Status,
    DateTime AdmissionDate, AdmissionTiming AdmissionTiming, HospitalizationCause? Cause, long? ClinicalServiceId, string? ClinicalServiceName,
    long? AttentionId, HospitalizationVitalSignResponse? LatestVitalSign, TreatmentScheduleBriefResponse? NextTreatmentSchedule,
    EvolutionNoteResponse? LatestEvolutionNote);

public sealed record CageResponse(long Id, string Name, CageSize Size, [property: JsonPropertyName("occupied")] bool IsOccupied, long BranchId,
    string? BranchName, CurrentHospitalizationBrief? CurrentHospitalization);

internal static class HospitalizationMapping
{
    public static readonly HospitalizationStatus[] ActiveStatuses =
    {
        HospitalizationStatus.ADMITTED, HospitalizationStatus.IN_TREATMENT, HospitalizationStatus.STABLE,
        HospitalizationStatus.OBSERVATION, HospitalizationStatus.CRITICAL,
    };

    public static readonly HospitalizationStatus[] FinalStatuses = { HospitalizationStatus.DISCHARGED, HospitalizationStatus.CANCELLED };

    public static HospitalizationResponse ToResponse(Hospitalization h) => new(h.Id, h.AnimalId, h.Animal?.Name, h.CageId, h.Cage?.Name,
        h.AttentionId, h.ClinicalServiceId, h.ClinicalService?.Name, h.AdmissionTiming, h.Cause, h.AdmissionDate, h.DischargeDate,
        h.AdmissionNotes, h.Status,
        h.EvolutionNotes.OrderBy(n => n.Id).Select(EvolutionNoteResponse.From).ToList(),
        h.TreatmentSchedules.OrderBy(t => t.Id).Select(TreatmentScheduleResponse.From).ToList(),
        h.VitalSigns.OrderByDescending(v => v.RecordedAt).Select(HospitalizationVitalSignResponse.From).ToList(),
        h.Version);

    public static CageResponse ToCage(Cage cage, Hospitalization? current)
    {
        CurrentHospitalizationBrief? brief = null;
        if (current is not null)
        {
            TreatmentSchedule? next = current.TreatmentSchedules.Where(t => !t.IsCompleted).OrderBy(t => t.ScheduledTime).FirstOrDefault();
            EvolutionNote? note = current.EvolutionNotes.OrderByDescending(n => n.Timestamp).FirstOrDefault();
            HospitalizationVitalSign? vital = current.VitalSigns.OrderByDescending(v => v.RecordedAt).FirstOrDefault();
            brief = new CurrentHospitalizationBrief(current.Id, AnimalBasicResponse.From(current.Animal), current.Status, current.AdmissionDate,
                current.AdmissionTiming, current.Cause, current.ClinicalServiceId, current.ClinicalService?.Name, current.AttentionId,
                vital is null ? null : HospitalizationVitalSignResponse.From(vital),
                next is null ? null : new TreatmentScheduleBriefResponse(next.Id, next.TreatmentName, next.ScheduledTime, next.IsCompleted),
                note is null ? null : EvolutionNoteResponse.From(note));
        }
        return new CageResponse(cage.Id, cage.Name, cage.Size, cage.IsOccupied, cage.BranchId, cage.Branch?.Name, brief);
    }

    public static IQueryable<Hospitalization> Full(this IQueryable<Hospitalization> q) => q
        .Include(h => h.Animal).Include(h => h.Cage).ThenInclude(c => c.Branch).Include(h => h.ClinicalService)
        .Include(h => h.EvolutionNotes).ThenInclude(n => n.Author)
        .Include(h => h.TreatmentSchedules).ThenInclude(t => t.CompletedBy)
        .Include(h => h.TreatmentSchedules).ThenInclude(t => t.ProductUsages).ThenInclude(u => u.Product)
        .Include(h => h.VitalSigns).ThenInclude(v => v.RecordedBy)
        .AsSplitQuery();
}

// ---- Jaulas ----

public interface ICageService
{
    Task<PaginatedResponse<CageResponse>> ListAsync(long? branchId, string? name, CageSize? size, bool? isOccupied, int page, int pageSize, CancellationToken ct = default);
    Task<CageResponse> GetAsync(long id, CancellationToken ct = default);
    Task<CageResponse> CreateAsync(CageRequest r, CancellationToken ct = default);
    Task<CageResponse> UpdateAsync(long id, CageRequest r, CancellationToken ct = default);
    Task DeleteAsync(long id, CancellationToken ct = default);
}

public sealed class CageService : ICageService
{
    private readonly TenantDbContext _db;

    public CageService(TenantDbContext db) => _db = db;

    private async Task<Hospitalization?> CurrentAsync(Cage cage, CancellationToken ct) => !cage.IsOccupied
        ? null
        : await _db.Hospitalizations.AsNoTracking().Full()
            .Where(h => h.CageId == cage.Id && HospitalizationMapping.ActiveStatuses.Contains(h.Status))
            .OrderByDescending(h => h.AdmissionDate).FirstOrDefaultAsync(ct);

    private async Task<Cage> RequireAsync(long id, CancellationToken ct) =>
        await _db.Cages.Include(c => c.Branch).FirstOrDefaultAsync(c => c.Id == id, ct) ?? throw new NotFoundException("Cage not found with id: " + id);

    public async Task<PaginatedResponse<CageResponse>> ListAsync(long? branchId, string? name, CageSize? size, bool? isOccupied, int page,
        int pageSize, CancellationToken ct = default)
    {
        IQueryable<Cage> query = _db.Cages.AsNoTracking().Include(c => c.Branch);
        if (branchId is not null) query = query.Where(c => c.BranchId == branchId);
        if (!string.IsNullOrWhiteSpace(name)) query = query.Where(c => EF.Functions.ILike(c.Name, $"%{name}%"));
        if (size is not null) query = query.Where(c => c.Size == size);
        if (isOccupied is not null) query = query.Where(c => c.IsOccupied == isOccupied);
        var cages = await query.OrderBy(c => c.Name).ThenBy(c => c.Id).ToPageAsync(page, pageSize, ct);
        var content = new List<CageResponse>();
        foreach (Cage cage in cages.Content) content.Add(HospitalizationMapping.ToCage(cage, await CurrentAsync(cage, ct)));
        return new PaginatedResponse<CageResponse>(content, cages.TotalPages, cages.TotalElements, cages.CurrentPage, cages.PageSize);
    }

    public async Task<CageResponse> GetAsync(long id, CancellationToken ct = default)
    {
        Cage cage = await RequireAsync(id, ct);
        return HospitalizationMapping.ToCage(cage, await CurrentAsync(cage, ct));
    }

    public async Task<CageResponse> CreateAsync(CageRequest r, CancellationToken ct = default)
    {
        var branch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == r.BranchId, ct) ?? throw new NotFoundException("Branch not found with id: " + r.BranchId);
        var cage = new Cage { Name = r.Name!, Size = r.Size!.Value, Branch = branch, IsOccupied = false };
        _db.Cages.Add(cage);
        await _db.SaveChangesAsync(ct);
        return HospitalizationMapping.ToCage(cage, null);
    }

    public async Task<CageResponse> UpdateAsync(long id, CageRequest r, CancellationToken ct = default)
    {
        Cage cage = await RequireAsync(id, ct);
        var branch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == r.BranchId, ct) ?? throw new NotFoundException("Branch not found with id: " + r.BranchId);
        cage.Name = r.Name!;
        cage.Size = r.Size!.Value;
        cage.Branch = branch;
        await _db.SaveChangesAsync(ct);
        return HospitalizationMapping.ToCage(cage, await CurrentAsync(cage, ct));
    }

    public async Task DeleteAsync(long id, CancellationToken ct = default)
    {
        Cage cage = await RequireAsync(id, ct);
        if (cage.IsOccupied) throw new BusinessRuleException("Cannot delete an occupied cage.");
        _db.Cages.Remove(cage);
        await _db.SaveChangesAsync(ct);
    }
}

// ---- Hospitalización ----

public interface IHospitalizationService
{
    Task<PaginatedResponse<HospitalizationSummaryResponse>> ListAsync(long? branchId, long? animalId, long? cageId,
        IReadOnlyCollection<HospitalizationStatus>? statuses, DateOnly? startDate, DateOnly? endDate, int page, int pageSize, CancellationToken ct = default);
    Task<HospitalizationResponse> GetAsync(long id, CancellationToken ct = default);
    Task<CageResponse> CreateAsync(CreateHospitalizationRequest r, CancellationToken ct = default);
    Task<HospitalizationPatchResponse> PatchAsync(long id, UpdateHospitalizationRequest r, CancellationToken ct = default);
    Task<HospitalizationResponse> AddEvolutionNoteAsync(long id, AddEvolutionNoteRequest r, CancellationToken ct = default);
    Task<HospitalizationResponse> AddVitalSignAsync(long id, CreateHospitalizationVitalSignRequest r, CancellationToken ct = default);
    Task<HospitalizationResponse> UpdateTreatmentScheduleAsync(long id, long scheduleId, UpdateTreatmentScheduleRequest r, CancellationToken ct = default);
    Task<HospitalizationResponse> AddTreatmentScheduleAsync(long id, CreateTreatmentScheduleRequest r, CancellationToken ct = default);
}

public sealed class HospitalizationService : IHospitalizationService
{
    private const string TreatmentOrigin = "TreatmentSchedule";
    private readonly TenantDbContext _db;
    private readonly IInventoryConsumptionService _consumption;
    private readonly IClock _clock;

    public HospitalizationService(TenantDbContext db, IInventoryConsumptionService consumption, IClock clock)
    {
        _db = db;
        _consumption = consumption;
        _clock = clock;
    }

    private async Task<Hospitalization> RequireAsync(long id, CancellationToken ct) =>
        await _db.Hospitalizations.Include(h => h.Cage).FirstOrDefaultAsync(h => h.Id == id, ct)
        ?? throw new NotFoundException("Hospitalization not found with id: " + id);

    private async Task<HospitalizationResponse> ReloadAsync(long id, CancellationToken ct)
    {
        _db.ChangeTracker.Clear();
        return HospitalizationMapping.ToResponse(await _db.Hospitalizations.AsNoTracking().Full().FirstAsync(h => h.Id == id, ct));
    }

    private static void AssertActive(Hospitalization h)
    {
        if (HospitalizationMapping.FinalStatuses.Contains(h.Status))
            throw new BusinessRuleException("La hospitalización ya fue " +
                                            (h.Status == HospitalizationStatus.DISCHARGED ? "dada de alta" : "cancelada") + " y no admite cambios");
    }

    public async Task<PaginatedResponse<HospitalizationSummaryResponse>> ListAsync(long? branchId, long? animalId, long? cageId,
        IReadOnlyCollection<HospitalizationStatus>? statuses, DateOnly? startDate, DateOnly? endDate, int page, int pageSize, CancellationToken ct = default)
    {
        IQueryable<Hospitalization> query = _db.Hospitalizations.AsNoTracking();
        if (branchId is not null) query = query.Where(h => h.Cage.BranchId == branchId);
        if (animalId is not null) query = query.Where(h => h.AnimalId == animalId);
        if (cageId is not null) query = query.Where(h => h.CageId == cageId);
        if (statuses is { Count: > 0 }) query = query.Where(h => statuses.Contains(h.Status));
        if (startDate is not null)
        {
            DateTime from = startDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(h => h.AdmissionDate >= from);
        }
        if (endDate is not null)
        {
            DateTime to = endDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(h => h.AdmissionDate <= to);
        }
        return await query.OrderByDescending(h => h.AdmissionDate).ThenByDescending(h => h.Id)
            .Select(h => new HospitalizationSummaryResponse(h.Id, h.AnimalId, h.Animal.Name, h.CageId, h.Cage.Name, h.Cage.BranchId,
                h.Cage.Branch.Name, h.AdmissionDate, h.Status, h.AdmissionTiming, h.Cause, h.ClinicalServiceId,
                h.ClinicalService != null ? h.ClinicalService.Name : null, h.Version))
            .ToPageAsync(page, pageSize, ct);
    }

    public async Task<HospitalizationResponse> GetAsync(long id, CancellationToken ct = default) =>
        HospitalizationMapping.ToResponse(await _db.Hospitalizations.AsNoTracking().Full().FirstOrDefaultAsync(h => h.Id == id, ct)
                                          ?? throw new NotFoundException("Hospitalization not found with id: " + id));

    public Task<CageResponse> CreateAsync(CreateHospitalizationRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            var animal = await _db.Animals.FirstOrDefaultAsync(a => a.Id == r.AnimalId, ct) ?? throw new NotFoundException("Animal not found with id: " + r.AnimalId);
            // La jaula se bloquea: dos ingresos simultáneos no pueden ocupar la misma.
            Cage cage = (await _db.Cages.FromSqlInterpolated($"SELECT * FROM cages WHERE id = {r.CageId} FOR UPDATE").ToListAsync(ct)).FirstOrDefault()
                        ?? throw new NotFoundException("Cage not found with id: " + r.CageId);
            if (cage.IsOccupied) throw new BusinessRuleException("La jaula ya está ocupada.");
            if (await _db.Hospitalizations.AnyAsync(h => h.AnimalId == animal.Id && !HospitalizationMapping.FinalStatuses.Contains(h.Status), ct))
                throw new BusinessRuleException("El paciente ya tiene una hospitalización vigente.");

            Attentions? attention = null;
            if (r.AttentionId is not null)
            {
                attention = await _db.Attentions.FirstOrDefaultAsync(a => a.Id == r.AttentionId, ct)
                    ?? throw new NotFoundException("Attention not found with id: " + r.AttentionId);
                if (attention.AnimalId != animal.Id) throw new InvalidArgumentException("Attention animal does not match hospitalization animal.");
                if (attention.BranchId != cage.BranchId) throw new InvalidArgumentException("Cage branch must match attention branch.");
            }
            AdmissionTiming timing = r.AdmissionTiming ?? AdmissionTiming.NONE;
            if (timing != AdmissionTiming.NONE && attention is null) throw new InvalidArgumentException("Admission timing requires an attention.");
            if (timing == AdmissionTiming.NONE && attention is not null) throw new InvalidArgumentException("When admission timing is NONE, attention must be null.");

            ClinicalService? service = r.ClinicalServiceId is null
                ? null
                : await _db.ClinicalServices.FirstOrDefaultAsync(s => s.Id == r.ClinicalServiceId, ct)
                  ?? throw new NotFoundException("ClinicalService not found with id: " + r.ClinicalServiceId);
            AssertCauseConsistent(r.Cause, service);

            var hospitalization = new Hospitalization
            {
                Animal = animal, Cage = cage, Attention = attention, AdmissionTiming = timing, Cause = r.Cause, ClinicalService = service,
                AdmissionDate = _clock.Now, AdmissionNotes = r.AdmissionNotes, Status = HospitalizationStatus.ADMITTED,
            };
            cage.IsOccupied = true;
            _db.Hospitalizations.Add(hospitalization);
            await _db.SaveChangesAsync(ct);
            await _db.Entry(cage).Reference(c => c.Branch).LoadAsync(ct);
            return HospitalizationMapping.ToCage(cage, hospitalization);
        }, ct);

    private static void AssertCauseConsistent(HospitalizationCause? cause, ClinicalService? service)
    {
        if (cause is null || service is null) return;
        ClinicalServiceCategory cat = service.ClinicalServiceCategory;
        bool ok = cause switch
        {
            HospitalizationCause.PRE_SURGERY or HospitalizationCause.POST_SURGERY => cat == ClinicalServiceCategory.SURGERY,
            HospitalizationCause.POST_GROOMING => cat == ClinicalServiceCategory.GROOMING,
            HospitalizationCause.CLINICAL_OBSERVATION or HospitalizationCause.MEDICATION_MONITORING =>
                cat is ClinicalServiceCategory.CONSULTATION or ClinicalServiceCategory.SURGERY or ClinicalServiceCategory.GROOMING,
            _ => true,
        };
        if (!ok) throw new ValidationFailedException("La causa y el servicio clínico deben ser coherentes cuando ambos están presentes");
    }

    public Task<HospitalizationPatchResponse> PatchAsync(long id, UpdateHospitalizationRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Hospitalization h = await RequireAsync(id, ct);
            await _db.Entry(h).Reference(x => x.ClinicalService).LoadAsync(ct);
            if (r.Version != h.Version) throw new DbUpdateConcurrencyException("Version desactualizada");
            AssertActive(h);
            var updated = new Dictionary<string, object?>();
            HospitalizationStatus? status = r.Status;
            if (r.DischargeDate is not null)
            {
                if (r.DischargeDate <= h.AdmissionDate)
                    throw new ValidationFailedException("La fecha de alta debe ser posterior a la fecha de admisión");
                h.DischargeDate = r.DischargeDate;
                updated["dischargeDate"] = r.DischargeDate;
                status ??= HospitalizationStatus.DISCHARGED;
            }
            if (r.AdmissionNotes is not null) { h.AdmissionNotes = r.AdmissionNotes; updated["admissionNotes"] = r.AdmissionNotes; }
            if (status is not null) { h.Status = status.Value; updated["status"] = status; }
            if (r.Cause is not null) { h.Cause = r.Cause; updated["cause"] = r.Cause; }
            if (r.ClinicalServiceId is not null)
            {
                h.ClinicalService = await _db.ClinicalServices.FirstOrDefaultAsync(s => s.Id == r.ClinicalServiceId, ct)
                    ?? throw new NotFoundException("ClinicalService not found with id: " + r.ClinicalServiceId);
                updated["clinicalServiceId"] = h.ClinicalService.Id;
            }
            AssertCauseConsistent(h.Cause, h.ClinicalService);
            // Al cerrar la hospitalización (alta o cancelación) se registra la salida y se libera la jaula.
            if (HospitalizationMapping.FinalStatuses.Contains(h.Status))
            {
                if (h.DischargeDate is null)
                {
                    h.DischargeDate = _clock.Now;
                    updated["dischargeDate"] = h.DischargeDate;
                }
                if (h.Cage.IsOccupied) h.Cage.IsOccupied = false;
            }
            await _db.SaveChangesAsync(ct);
            return new HospitalizationPatchResponse(h.Id, h.Version, h.Status, updated);
        }, ct);

    public Task<HospitalizationResponse> AddEvolutionNoteAsync(long id, AddEvolutionNoteRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Hospitalization h = await RequireAsync(id, ct);
            AssertActive(h);
            Employee author = await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.AuthorId, ct) ?? throw new NotFoundException("Employee not found with id: " + r.AuthorId);
            _db.EvolutionNotes.Add(new EvolutionNote { HospitalizationId = h.Id, Author = author, Note = r.Note!, Timestamp = _clock.Now });
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(id, ct);
        }, ct);

    public Task<HospitalizationResponse> AddVitalSignAsync(long id, CreateHospitalizationVitalSignRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Hospitalization h = await RequireAsync(id, ct);
            AssertActive(h);
            if (r.WeightKg is null && r.TemperatureCelsius is null && r.HeartRate is null && r.RespiratoryRate is null)
                throw new InvalidArgumentException("Debe registrar al menos una constante vital.");
            Employee by = await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.RecordedByEmployeeId, ct)
                ?? throw new NotFoundException("Employee not found with id: " + r.RecordedByEmployeeId);
            _db.HospitalizationVitalSigns.Add(new HospitalizationVitalSign
            {
                HospitalizationId = h.Id, RecordedBy = by, RecordedAt = r.RecordedAt ?? _clock.Now, WeightKg = r.WeightKg,
                TemperatureCelsius = r.TemperatureCelsius, HeartRate = r.HeartRate, RespiratoryRate = r.RespiratoryRate,
            });
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(id, ct);
        }, ct);

    /// <summary>
    /// Marcar un tratamiento como hecho descuenta del inventario los productos usados; desmarcarlo (o volver a marcarlo)
    /// devuelve primero lo consumido antes.
    /// </summary>
    public Task<HospitalizationResponse> UpdateTreatmentScheduleAsync(long id, long scheduleId, UpdateTreatmentScheduleRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Hospitalization h = await RequireAsync(id, ct);
            AssertActive(h);
            TreatmentSchedule schedule = await _db.TreatmentSchedules.Include(t => t.ProductUsages).FirstOrDefaultAsync(t => t.Id == scheduleId, ct)
                ?? throw new NotFoundException("TreatmentSchedule not found with id: " + scheduleId);
            if (schedule.HospitalizationId != id) throw new InvalidArgumentException("Treatment schedule does not belong to the specified hospitalization.");
            if (schedule.IsCompleted) await _consumption.RestoreAsync(TreatmentOrigin, schedule.Id, ct);

            schedule.IsCompleted = r.IsCompleted!.Value;
            schedule.Notes = r.Notes;
            foreach (TreatmentScheduleProductUsage usage in schedule.ProductUsages.ToList()) _db.TreatmentScheduleProductUsages.Remove(usage);
            schedule.ProductUsages.Clear();
            if (schedule.IsCompleted)
            {
                schedule.CompletedAt = _clock.Now;
                schedule.CompletedBy = r.CompletedByEmployeeId is null
                    ? null
                    : await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.CompletedByEmployeeId, ct)
                      ?? throw new NotFoundException("Employee not found with id: " + r.CompletedByEmployeeId);
                if (r.CompletedByEmployeeId is null) schedule.CompletedById = null;
                foreach (TreatmentScheduleProductUsageRequest p in r.Products ?? new())
                {
                    Product product = await _db.Products.FirstOrDefaultAsync(x => x.Id == p.ProductId, ct)
                        ?? throw new NotFoundException("Product not found with id: " + p.ProductId);
                    schedule.ProductUsages.Add(new TreatmentScheduleProductUsage { TreatmentSchedule = schedule, Product = product, Quantity = p.Quantity!.Value, Unit = p.Unit!.Value });
                    await _consumption.ConsumeAsync(product.Id, h.Cage.BranchId, p.Quantity, p.Unit, TreatmentOrigin, schedule.Id, ct);
                }
            }
            else
            {
                schedule.CompletedAt = null;
                schedule.CompletedBy = null;
                schedule.CompletedById = null;
            }
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(id, ct);
        }, ct);

    public Task<HospitalizationResponse> AddTreatmentScheduleAsync(long id, CreateTreatmentScheduleRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Hospitalization h = await RequireAsync(id, ct);
            AssertActive(h);
            bool recurring = r.FrequencyValue is not null && r.FrequencyUnit is not null;
            int doses = recurring ? r.NumberOfDoses ?? 1 : 1;
            DateTime time = r.ScheduledTime!.Value;
            for (int i = 0; i < doses; i++)
            {
                _db.TreatmentSchedules.Add(new TreatmentSchedule
                {
                    HospitalizationId = h.Id, TreatmentName = r.TreatmentName!, ScheduledTime = time, Notes = r.Notes, IsCompleted = false,
                });
                if (recurring)
                    time = r.FrequencyUnit switch
                    {
                        FrequencyUnit.MINUTES => time.AddMinutes(r.FrequencyValue!.Value),
                        FrequencyUnit.HOURS => time.AddHours(r.FrequencyValue!.Value),
                        _ => time.AddDays(r.FrequencyValue!.Value),
                    };
            }
            await _db.SaveChangesAsync(ct);
            return await ReloadAsync(id, ct);
        }, ct);
}
