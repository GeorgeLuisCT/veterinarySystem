using VetSaas.Modules.Catalogs;
using System.Globalization;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Clinic.Application;

internal static class ClinicFormat
{
    public static string? Sex(AnimalSex? s) => s switch
    {
        null => null,
        AnimalSex.MALE => "Macho", AnimalSex.FEMALE => "Hembra", AnimalSex.CASTRATED_MALE => "Macho castrado", _ => "Hembra esterilizada",
    };

    /// <summary>Edad legible («2 años 3 meses»; si es menor a un mes, en días).</summary>
    public static string Age(DateOnly birth, DateOnly today)
    {
        int years = today.Year - birth.Year;
        int months = today.Month - birth.Month;
        int days = today.Day - birth.Day;
        if (days < 0)
        {
            months--;
            DateOnly prev = today.AddMonths(-1);
            days += DateTime.DaysInMonth(prev.Year, prev.Month);
        }
        if (months < 0) { years--; months += 12; }
        var parts = new List<string>();
        if (years > 0) parts.Add($"{years} año{(years == 1 ? "" : "s")}");
        if (months > 0) parts.Add($"{months} mes{(months == 1 ? "" : "es")}");
        if (parts.Count == 0) parts.Add($"{days} día{(days == 1 ? "" : "s")}");
        return string.Join(" ", parts);
    }

    public static DateOnly AddPeriod(DateOnly date, int period, TimeUnit unit) => unit switch
    {
        TimeUnit.DAYS => date.AddDays(period),
        TimeUnit.WEEKS => date.AddDays(7 * period),
        _ => date.AddMonths(period),
    };

    /// <summary>Número redondeado y sin ceros de más («12.50» → «12.5»).</summary>
    public static string Number(double value, int decimals) =>
        Math.Round((decimal)value, decimals, MidpointRounding.AwayFromZero).ToString("0.############", CultureInfo.InvariantCulture);
}

// =====================================================================================================
// Registros médicos (línea de tiempo)
// =====================================================================================================

public sealed record MedicalRecordSummaryResponse(DateTime OccurredAt, string Category, string? Title);

public interface IMedicalRecordService
{
    Task<List<MedicalRecordSummaryResponse>> Last20Async(long animalId, CancellationToken ct = default);
}

public sealed class MedicalRecordService : IMedicalRecordService
{
    private readonly TenantDbContext _db;

    public MedicalRecordService(TenantDbContext db) => _db = db;

    public async Task<List<MedicalRecordSummaryResponse>> Last20Async(long animalId, CancellationToken ct = default)
    {
        if (!await _db.Animals.AnyAsync(a => a.Id == animalId, ct))
            throw new NotFoundException($"El animal con id {animalId} no existe");
        return await _db.MedicalRecordEntries.AsNoTracking().Where(e => e.AnimalId == animalId)
            .OrderByDescending(e => e.OccurredAt).Take(20)
            .Select(e => new MedicalRecordSummaryResponse(e.OccurredAt, e.Category, e.Title)).ToListAsync(ct);
    }
}

// =====================================================================================================
// Recordatorios
// =====================================================================================================

public sealed record ReminderCreateRequest(long? AnimalId, ReminderType? ReminderType, DateOnly? DueDate);
public sealed record ReminderUpdateStatusRequest(ReminderStatus? Status);

public sealed class ReminderCreateValidator : AbstractValidator<ReminderCreateRequest>
{
    public ReminderCreateValidator(IClock clock)
    {
        RuleFor(r => r.AnimalId).NotNull().WithMessage("El animal es obligatorio");
        RuleFor(r => r.ReminderType).NotNull().WithMessage("El tipo de recordatorio es obligatorio");
        RuleFor(r => r.DueDate).NotNull().WithMessage("La fecha prevista es obligatoria")
            .Must(d => d is null || d >= clock.Today).WithMessage("La fecha del recordatorio no puede estar en el pasado");
    }
}

public sealed class ReminderUpdateStatusValidator : AbstractValidator<ReminderUpdateStatusRequest>
{
    public ReminderUpdateStatusValidator() => RuleFor(r => r.Status).NotNull().WithMessage("El estado es obligatorio");
}

public sealed record ReminderListItemResponse(long? Id, string? ExternalId, bool Automatic, bool Deletable, ReminderType ReminderType,
    ReminderStatus Status, DateOnly DueDate, string Subject, string? Detail, long AnimalId, string AnimalName, string AnimalSpecies,
    long? OwnerId, string? OwnerName, string? OwnerPhone, string? OwnerEmail, string? BranchName);

public sealed record ReminderQueryFilters(string? Query, IReadOnlyCollection<ReminderType>? Types, IReadOnlyCollection<ReminderStatus>? Statuses,
    DateOnly? DueFrom, DateOnly? DueTo, bool IncludeManual, bool IncludeAutomatic);

public interface IReminderService
{
    Task<PaginatedResponse<ReminderListItemResponse>> ListAsync(ReminderQueryFilters filters, int page, int size, CancellationToken ct = default);
    Task<ReminderListItemResponse> CreateAsync(ReminderCreateRequest r, CancellationToken ct = default);
    Task DeleteAsync(long id, CancellationToken ct = default);
    Task<ReminderListItemResponse> UpdateStatusAsync(long id, ReminderStatus status, CancellationToken ct = default);
}

public sealed class ReminderService : IReminderService
{
    private readonly TenantDbContext _db;
    private readonly IClock _clock;

    public ReminderService(TenantDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    private static string Label(ReminderType type) => type switch
    {
        ReminderType.VACCINATION => "Vacunación", ReminderType.DEWORMING => "Desparasitación", ReminderType.CHECKUP => "Consulta de control",
        ReminderType.LAB_TEST => "Examen de laboratorio", ReminderType.SURGERY_FOLLOWUP => "Seguimiento post quirúrgico",
        ReminderType.MEDICATION_REFILL => "Reposición de medicación", ReminderType.GROOMING => "Corte y baño",
        ReminderType.DENTAL_CARE => "Profilaxis dental", _ => "Recordatorio",
    };

    private static ReminderType FromCategory(ClinicalServiceCategory c) => c switch
    {
        ClinicalServiceCategory.VACCINATION => ReminderType.VACCINATION, ClinicalServiceCategory.DEWORMING => ReminderType.DEWORMING,
        ClinicalServiceCategory.GROOMING => ReminderType.GROOMING, ClinicalServiceCategory.SURGERY => ReminderType.SURGERY_FOLLOWUP,
        ClinicalServiceCategory.LABORATORY => ReminderType.LAB_TEST, ClinicalServiceCategory.CONSULTATION => ReminderType.CHECKUP,
        _ => ReminderType.OTHER,
    };

    private static ReminderListItemResponse Manual(Reminder r)
    {
        Animal a = r.Animal;
        Customer? o = a.Owner;
        return new ReminderListItemResponse(r.Id, null, false, true, r.ReminderType, r.Status, r.DueDate,
            "Recordatorio manual • " + Label(r.ReminderType), null, a.Id, a.Name, a.Species, o?.Id, o?.Name, o?.PhoneNumber, o?.Email, null);
    }

    /// <summary>
    /// Une los recordatorios creados a mano con los automáticos: cada servicio aplicado con periodicidad (vacuna, desparasitación…)
    /// genera uno para la fecha de aplicación + período. Ordenados por fecha y paginados en memoria, como en el backend anterior.
    /// </summary>
    public async Task<PaginatedResponse<ReminderListItemResponse>> ListAsync(ReminderQueryFilters f, int page, int size, CancellationToken ct = default)
    {
        var all = new List<ReminderListItemResponse>();
        string? like = string.IsNullOrWhiteSpace(f.Query) ? null : $"%{f.Query.Trim()}%";

        if (f.IncludeManual)
        {
            IQueryable<Reminder> q = _db.Reminders.AsNoTracking().Include(r => r.Animal).ThenInclude(a => a.Owner);
            if (like is not null)
                q = q.Where(r => EF.Functions.ILike(r.Animal.Name, like) || EF.Functions.ILike(r.Animal.Owner.Name, like) ||
                                 EF.Functions.ILike(r.Animal.MicrochipNumber ?? "", like));
            if (f.Types is { Count: > 0 }) q = q.Where(r => f.Types.Contains(r.ReminderType));
            if (f.Statuses is { Count: > 0 }) q = q.Where(r => f.Statuses.Contains(r.Status));
            if (f.DueFrom is not null) q = q.Where(r => r.DueDate >= f.DueFrom);
            if (f.DueTo is not null) q = q.Where(r => r.DueDate <= f.DueTo);
            all.AddRange((await q.OrderBy(r => r.DueDate).ThenBy(r => r.Id).ToListAsync(ct)).Select(Manual));
        }

        if (f.IncludeAutomatic)
        {
            var items = await _db.ClinicalServiceItems.AsNoTracking()
                .Include(i => i.ClinicalService)
                .Include(i => i.ClinicalAttention).ThenInclude(c => c.Attention).ThenInclude(a => a.Animal).ThenInclude(a => a.Owner)
                .Include(i => i.ClinicalAttention).ThenInclude(c => c.Attention).ThenInclude(a => a.AttendingEmployee)
                .Include(i => i.ClinicalAttention).ThenInclude(c => c.Attention).ThenInclude(a => a.Branch)
                .Where(i => i.ClinicalService.ReminderPeriod != null && i.ClinicalService.ReminderPeriod > 0 && i.ClinicalService.ReminderPeriodUnit != null)
                .AsSplitQuery().ToListAsync(ct);
            string? needle = f.Query?.Trim().ToLowerInvariant();
            foreach (ClinicalServiceItem item in items)
            {
                ClinicalService service = item.ClinicalService;
                ReminderType type = FromCategory(service.ClinicalServiceCategory);
                if (f.Types is { Count: > 0 } && !f.Types.Contains(type)) continue;
                DateOnly visit = DateOnly.FromDateTime(item.ClinicalAttention.VisitDate);
                DateOnly due = ClinicFormat.AddPeriod(visit, service.ReminderPeriod!.Value, service.ReminderPeriodUnit!.Value);
                if (f.DueFrom is not null && due < f.DueFrom) continue;
                if (f.DueTo is not null && due > f.DueTo) continue;
                const ReminderStatus status = ReminderStatus.PENDING;
                if (f.Statuses is { Count: > 0 } && !f.Statuses.Contains(status)) continue;
                Attentions attention = item.ClinicalAttention.Attention;
                Animal animal = attention.Animal;
                Customer? owner = animal.Owner;
                if (!string.IsNullOrEmpty(needle) &&
                    !(animal.Name ?? "").ToLowerInvariant().Contains(needle) && !(owner?.Name ?? "").ToLowerInvariant().Contains(needle) &&
                    !(animal.MicrochipNumber ?? "").ToLowerInvariant().Contains(needle))
                    continue;

                var detail = new List<string> { "Servicio aplicado: " + service.Name };
                string? vet = attention.AttendingEmployee?.FullName;
                if (!string.IsNullOrWhiteSpace(vet)) detail.Add("Profesional: " + vet);
                detail.Add("Fecha de aplicación: " + visit.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
                all.Add(new ReminderListItemResponse(null, "svc-" + item.Id, true, false, type, status, due, $"{Label(type)} • {service.Name}",
                    string.Join(" • ", detail), animal.Id, animal.Name, animal.Species, owner?.Id, owner?.Name, owner?.PhoneNumber,
                    owner?.Email, attention.Branch?.Name));
            }
        }

        var ordered = all.OrderBy(r => r.DueDate).ThenBy(r => r.Automatic).ThenBy(r => r.Subject, StringComparer.OrdinalIgnoreCase).ToList();
        if (size <= 0) size = 10;
        page = Math.Max(page, 0);
        var content = ordered.Skip(page * size).Take(size).ToList();
        return new PaginatedResponse<ReminderListItemResponse>(content, (int)Math.Ceiling(ordered.Count / (double)size), ordered.Count, page, size);
    }

    public async Task<ReminderListItemResponse> CreateAsync(ReminderCreateRequest r, CancellationToken ct = default)
    {
        Animal animal = await _db.Animals.Include(a => a.Owner).FirstOrDefaultAsync(a => a.Id == r.AnimalId, ct)
            ?? throw new NotFoundException("No se encontró el animal con id " + r.AnimalId);
        var reminder = new Reminder { Animal = animal, ReminderType = r.ReminderType!.Value, DueDate = r.DueDate!.Value, Status = ReminderStatus.PENDING };
        _db.Reminders.Add(reminder);
        await _db.SaveChangesAsync(ct);
        return Manual(reminder);
    }

    public async Task DeleteAsync(long id, CancellationToken ct = default)
    {
        Reminder reminder = await _db.Reminders.FirstOrDefaultAsync(r => r.Id == id, ct) ?? throw new NotFoundException("No se encontró el recordatorio con id " + id);
        _db.Reminders.Remove(reminder);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<ReminderListItemResponse> UpdateStatusAsync(long id, ReminderStatus status, CancellationToken ct = default)
    {
        Reminder reminder = await _db.Reminders.Include(r => r.Animal).ThenInclude(a => a.Owner).FirstOrDefaultAsync(r => r.Id == id, ct)
            ?? throw new NotFoundException("No se encontró el recordatorio con id " + id);
        reminder.Status = status;
        await _db.SaveChangesAsync(ct);
        return Manual(reminder);
    }
}

// =====================================================================================================
// Historia clínica
// =====================================================================================================

public sealed record ClinicalHistoryAnimalSummaryResponse(long AnimalId, string AnimalName, string Species, string? SpeciesLabel,
    string? Breed, AnimalSex? Sex, string? OwnerName, string? OwnerPhone, string? OwnerEmail, string? Microchip, DateOnly BirthDate, string Age,
    bool Active, DateTime? LastVisitDate, string? LastVisitService, string? LastVeterinarian, long TotalConsultations, long TotalLabRequests,
    long TotalProcedures, double? LastRecordedWeightKg);

public sealed record HistoryOwnerInfo(long Id, string Name, string? Email, string? PhoneNumber, string? Address, string? DocumentType, string DocumentNumber);

public sealed record HistoryPatientInfo(long AnimalId, string Name, string? PhotoUrl, string Species, string? SpeciesLabel, string? Breed,
    AnimalSex? Sex, string? SexLabel, DateOnly BirthDate, string Age, string? Microchip, bool Active, IReadOnlyCollection<string> Allergies,
    IReadOnlyCollection<string> ChronicConditions, HistoryOwnerInfo? Owner, DateTime? LastVisitDate, string? LastVisitService, string? LastVeterinarian);

public sealed record HistoryVitals(double? WeightKg, double? TemperatureCelsius, int? HeartRate, int? RespiratoryRate);

public sealed record HistoryMedication(long Id, string? ProductName, decimal? DoseAmount, string? DoseUnit, string? Route, int? FrequencyValue,
    string? FrequencyUnit, DateTime AdministeredAt, string? AdministeredBy, string? Notes);

public sealed record HistoryServiceItem(long Id, string? ClinicalServiceName, ClinicalServiceCategory? Category, decimal Quantity, decimal Subtotal, string? Notes);

public sealed record HistoryConsultation(long Id, DateTime VisitDate, ClinicalServiceCategory? ServiceCategory, string? ClinicalServiceName,
    string? Veterinarian, string? BranchName, string? ReasonForVisit, HistoryVitals Vitals, string? Subjective, string? Objective,
    string? Diagnosis, string? Treatment, string? Notes, IReadOnlyList<HistoryMedication> Medications, IReadOnlyList<HistoryServiceItem> AdditionalServices);

public enum ProcedureType { SURGERY, HOSPITALIZATION }

public sealed record HistoryProcedure(long Id, ProcedureType Type, string Title, DateTime? StartedAt, DateTime? EndedAt, string? ProfessionalInCharge,
    string? Notes, string? Status);

public sealed record HistoryPreventiveEvent(long ServiceItemId, string ServiceName, ClinicalServiceCategory Category, DateTime PerformedAt,
    DateOnly? NextDueDate, string? Veterinarian, string? Notes);

public sealed record HistoryGroomingEntry(long Id, string ServiceName, GroomingStatus Status, DateTime? StartedAt, DateTime? FinishedAt,
    string? AssignedProfessional, string? BehaviorNotes, string? ClinicalObservations);

public sealed record HistoryPreventiveCare(IReadOnlyList<HistoryPreventiveEvent> Vaccines, IReadOnlyList<HistoryPreventiveEvent> Deworming,
    IReadOnlyList<HistoryGroomingEntry> GroomingSessions);

public sealed record HistoryLabParameter(string? Name, string? Value, string? Unit, string? ReferenceRange, string? Flag, string? Comment);

public sealed record HistoryLabResult(long RequestId, string? LaboratoryName, string? RequestingVeterinarian, DateTime RequestedAt, DateTime? ReportedAt,
    LabRequestStatus Status, string? TestName, string? ClinicalNotes, IReadOnlyList<HistoryLabParameter> Parameters);

public sealed record HistoryWeightEntry(DateTime RecordedAt, double WeightKg, long SourceClinicalAttentionId);

public sealed record HistoryTreatmentProductUsage(long Id, long ProductId, string? ProductName, decimal Quantity, ProductUnitType Unit);

public sealed record HistoryTreatmentSchedule(long Id, string TreatmentName, DateTime ScheduledTime, bool Completed, DateTime? CompletedAt,
    string? CompletedBy, string? Notes, IReadOnlyList<HistoryTreatmentProductUsage> Products);

public sealed record HistoryEvolutionNote(long Id, DateTime Timestamp, string? Author, string Note);

public sealed record HistoryHospitalization(long Id, DateTime AdmissionDate, DateTime? DischargeDate, HospitalizationStatus Status,
    HospitalizationCause? Cause, string? ClinicalServiceName, string? AttendingEmployee, string? AdmissionNotes,
    IReadOnlyList<HistoryTreatmentSchedule> TreatmentSchedules, IReadOnlyList<HistoryEvolutionNote> EvolutionNotes);

public sealed record ClinicalHistoryDetailResponse(HistoryPatientInfo Patient, HistoryConsultation? LastConsultation,
    IReadOnlyList<HistoryConsultation> Consultations, IReadOnlyList<HistoryProcedure> Procedures, HistoryPreventiveCare PreventiveCare,
    IReadOnlyList<HistoryLabResult> LabResults, IReadOnlyList<HistoryWeightEntry> WeightHistory, IReadOnlyList<HistoryHospitalization> Hospitalizations);

public interface IClinicalHistoryService
{
    Task<PaginatedResponse<ClinicalHistoryAnimalSummaryResponse>> SearchAnimalsAsync(string? query, IReadOnlyCollection<string>? species,
        bool? active, int page, int size, CancellationToken ct = default);
    Task<ClinicalHistoryDetailResponse> GetAnimalHistoryAsync(long animalId, DateOnly? from, DateOnly? to, CancellationToken ct = default);
}

public sealed class ClinicalHistoryService : IClinicalHistoryService
{
    private readonly TenantDbContext _db;
    private readonly IClock _clock;

    public ClinicalHistoryService(TenantDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<PaginatedResponse<ClinicalHistoryAnimalSummaryResponse>> SearchAnimalsAsync(string? query,
        IReadOnlyCollection<string>? species, bool? active, int page, int size, CancellationToken ct = default)
    {
        IQueryable<Animal> animals = _db.Animals.AsNoTracking().Include(a => a.Owner);
        if (!string.IsNullOrWhiteSpace(query))
        {
            string like = $"%{query.Trim()}%";
            animals = animals.Where(a => EF.Functions.ILike(a.Name, like) || EF.Functions.ILike(a.Owner.Name, like) ||
                                         EF.Functions.ILike(a.Breed ?? "", like) || EF.Functions.ILike(a.MicrochipNumber ?? "", like));
        }
        if (species is { Count: > 0 }) animals = animals.Where(a => species.Contains(a.Species));
        if (active is not null) animals = animals.Where(a => a.IsActive == active);
        var pageResult = await animals.OrderBy(a => a.Name).ThenBy(a => a.Id).ToPageAsync(page, size, ct);
        var ids = pageResult.Content.Select(a => a.Id).ToList();

        var consultations = await _db.ClinicalAttentions.Where(c => ids.Contains(c.Attention.AnimalId)).GroupBy(c => c.Attention.AnimalId)
            .Select(g => new { g.Key, Count = g.LongCount() }).ToDictionaryAsync(x => x.Key, x => x.Count, ct);
        var labs = await _db.LaboratoryRequests.Where(r => ids.Contains(r.AnimalId)).GroupBy(r => r.AnimalId)
            .Select(g => new { g.Key, Count = g.LongCount() }).ToDictionaryAsync(x => x.Key, x => x.Count, ct);
        var surgeries = await _db.SurgicalReports.Where(r => ids.Contains(r.Attention.AnimalId)).GroupBy(r => r.Attention.AnimalId)
            .Select(g => new { g.Key, Count = g.LongCount() }).ToDictionaryAsync(x => x.Key, x => x.Count, ct);
        var hospitalizations = await _db.Hospitalizations.Where(h => ids.Contains(h.AnimalId)).GroupBy(h => h.AnimalId)
            .Select(g => new { g.Key, Count = g.LongCount() }).ToDictionaryAsync(x => x.Key, x => x.Count, ct);

        // Última consulta de cada paciente.
        var latest = (await _db.ClinicalAttentions.AsNoTracking()
                .Include(c => c.Attention).ThenInclude(a => a.Service)
                .Include(c => c.Attention).ThenInclude(a => a.AttendingEmployee)
                .Where(c => ids.Contains(c.Attention.AnimalId))
                .ToListAsync(ct))
            .GroupBy(c => c.Attention.AnimalId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(c => c.VisitDate).First());

        Dictionary<string, string> speciesLabels = await _db.CatalogLabelsAsync(CatalogKeys.AnimalSpecies, ct);
        DateOnly today = _clock.Today;
        return pageResult.Map(a =>
        {
            latest.TryGetValue(a.Id, out ClinicalAttention? last);
            return new ClinicalHistoryAnimalSummaryResponse(a.Id, a.Name, a.Species, speciesLabels.GetValueOrDefault(a.Species, a.Species), a.Breed, a.Sex,
                a.Owner?.Name, a.Owner?.PhoneNumber, a.Owner?.Email, a.MicrochipNumber, a.BirthDate, ClinicFormat.Age(a.BirthDate, today),
                a.IsActive, last?.VisitDate, last?.Attention.Service?.Name, last?.Attention.AttendingEmployee?.FullName,
                consultations.GetValueOrDefault(a.Id), labs.GetValueOrDefault(a.Id),
                surgeries.GetValueOrDefault(a.Id) + hospitalizations.GetValueOrDefault(a.Id), last?.WeightKg);
        });
    }

    public async Task<ClinicalHistoryDetailResponse> GetAnimalHistoryAsync(long animalId, DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        Animal animal = await _db.Animals.AsNoTracking().Include(a => a.Owner).ThenInclude(o => o.DocumentType)
                            .FirstOrDefaultAsync(a => a.Id == animalId, ct)
                        ?? throw new NotFoundException("No se encontró el paciente con id " + animalId);
        DateTime? fromDt = from?.ToDateTime(TimeOnly.MinValue);
        DateTime? toDt = to?.ToDateTime(TimeOnly.MaxValue);

        IQueryable<ClinicalAttention> cq = _db.ClinicalAttentions.AsNoTracking()
            .Include(c => c.Attention).ThenInclude(a => a.Service)
            .Include(c => c.Attention).ThenInclude(a => a.AttendingEmployee)
            .Include(c => c.Attention).ThenInclude(a => a.Branch)
            .Include(c => c.Attention).ThenInclude(a => a.Appointment!).ThenInclude(ap => ap.ClinicalDetail)
            .Include(c => c.MedicationAdministrations).ThenInclude(m => m.Product)
            .Include(c => c.MedicationAdministrations).ThenInclude(m => m.AdministeredBy)
            .Include(c => c.ServiceItems).ThenInclude(i => i.ClinicalService)
            .Where(c => c.Attention.AnimalId == animalId).AsSplitQuery();
        if (fromDt is not null) cq = cq.Where(c => c.VisitDate >= fromDt);
        if (toDt is not null) cq = cq.Where(c => c.VisitDate <= toDt);
        List<ClinicalAttention> consultations = await cq.OrderByDescending(c => c.VisitDate).ToListAsync(ct);

        IQueryable<LaboratoryRequest> lq = _db.LaboratoryRequests.AsNoTracking()
            .Include(r => r.Laboratory).Include(r => r.RequestingEmployee)
            .Include(r => r.Items).ThenInclude(i => i.Test)
            .Include(r => r.Items).ThenInclude(i => i.Results).ThenInclude(v => v.Parameter)
            .Where(r => r.AnimalId == animalId).AsSplitQuery();
        if (fromDt is not null) lq = lq.Where(r => r.CreatedAt >= fromDt);
        if (toDt is not null) lq = lq.Where(r => r.CreatedAt <= toDt);
        List<LaboratoryRequest> labs = await lq.ToListAsync(ct);

        IQueryable<SurgicalReport> sq = _db.SurgicalReports.AsNoTracking()
            .Include(r => r.Attention).ThenInclude(a => a.Service).Include(r => r.Surgeon)
            .Where(r => r.Attention.AnimalId == animalId);
        if (fromDt is not null) sq = sq.Where(r => r.SurgeryStartAt >= fromDt);
        if (toDt is not null) sq = sq.Where(r => r.SurgeryStartAt <= toDt);
        List<SurgicalReport> surgeries = await sq.ToListAsync(ct);

        IQueryable<GroomingSession> gq = _db.GroomingSessions.AsNoTracking()
            .Include(s => s.Attention).ThenInclude(a => a.Service).Include(s => s.AssignedProfessional)
            .Where(s => s.Attention.AnimalId == animalId);
        if (fromDt is not null) gq = gq.Where(s => s.StartedAt >= fromDt);
        if (toDt is not null) gq = gq.Where(s => (s.FinishedAt != null && s.FinishedAt <= toDt) || s.StartedAt <= toDt);
        List<GroomingSession> groomings = await gq.ToListAsync(ct);

        IQueryable<Hospitalization> hq = _db.Hospitalizations.AsNoTracking()
            .Include(h => h.ClinicalService)
            .Include(h => h.Attention!).ThenInclude(a => a.AttendingEmployee)
            .Include(h => h.EvolutionNotes).ThenInclude(n => n.Author)
            .Include(h => h.TreatmentSchedules).ThenInclude(t => t.CompletedBy)
            .Include(h => h.TreatmentSchedules).ThenInclude(t => t.ProductUsages).ThenInclude(u => u.Product)
            .Where(h => h.AnimalId == animalId).AsSplitQuery();
        if (fromDt is not null) hq = hq.Where(h => h.DischargeDate == null || h.DischargeDate >= fromDt);
        if (toDt is not null) hq = hq.Where(h => h.AdmissionDate <= toDt);
        List<Hospitalization> hospitalizations = await hq.OrderByDescending(h => h.AdmissionDate).ToListAsync(ct);

        List<HistoryConsultation> consultationDtos = consultations.Select(ToConsultation).ToList();
        HistoryConsultation? last = consultationDtos.FirstOrDefault();

        var procedures = surgeries.Select(r => new HistoryProcedure(r.Id, ProcedureType.SURGERY,
                r.Attention.Service?.Name ?? "Procedimiento quirúrgico", r.SurgeryStartAt, r.SurgeryEndAt, r.Surgeon?.FullName, r.Findings,
                r.Status.ToString()))
            .Concat(hospitalizations.Select(h => new HistoryProcedure(h.Id, ProcedureType.HOSPITALIZATION, h.ClinicalService?.Name ?? "Hospitalización",
                h.AdmissionDate, h.DischargeDate, h.Attention?.AttendingEmployee?.FullName, h.AdmissionNotes, h.Status.ToString())))
            .OrderByDescending(p => p.StartedAt.HasValue).ThenByDescending(p => p.StartedAt).ToList();

        var vaccines = new List<HistoryPreventiveEvent>();
        var deworming = new List<HistoryPreventiveEvent>();
        foreach (ClinicalAttention c in consultations)
        foreach (ClinicalServiceItem item in c.ServiceItems)
        {
            ClinicalService service = item.ClinicalService;
            if (service.ClinicalServiceCategory is not (ClinicalServiceCategory.VACCINATION or ClinicalServiceCategory.DEWORMING)) continue;
            DateOnly? next = service.ReminderPeriod is > 0 && service.ReminderPeriodUnit is not null
                ? ClinicFormat.AddPeriod(DateOnly.FromDateTime(c.VisitDate), service.ReminderPeriod.Value, service.ReminderPeriodUnit.Value)
                : null;
            var ev = new HistoryPreventiveEvent(item.Id, service.Name, service.ClinicalServiceCategory, c.VisitDate, next,
                c.Attention.AttendingEmployee?.FullName, item.Notes);
            (service.ClinicalServiceCategory == ClinicalServiceCategory.VACCINATION ? vaccines : deworming).Add(ev);
        }
        var groomingEntries = groomings.OrderByDescending(s => (s.StartedAt ?? s.FinishedAt).HasValue).ThenByDescending(s => s.StartedAt ?? s.FinishedAt)
            .Select(s => new HistoryGroomingEntry(s.Id, s.Attention.Service?.Name ?? "Grooming", s.Status, s.StartedAt, s.FinishedAt,
                s.AssignedProfessional?.FullName, s.BehaviorNotes, s.ClinicalObservations)).ToList();

        var labResults = labs.SelectMany(r => r.Items.Select(i => new HistoryLabResult(r.Id, r.Laboratory?.Name, r.RequestingEmployee?.FullName,
                r.CreatedAt, i.ReportedAt, r.Status, i.Test?.Name, r.ClinicalNotes, i.Results.Select(ToLabParameter).ToList())))
            .OrderByDescending(x => x.RequestedAt).ToList();

        var weights = consultations.Where(c => c.WeightKg is not null)
            .Select(c => new HistoryWeightEntry(c.VisitDate, c.WeightKg!.Value, c.Id)).OrderBy(w => w.RecordedAt).ToList();

        Customer? owner = animal.Owner;
        Dictionary<string, string> speciesLabels = await _db.CatalogLabelsAsync(CatalogKeys.AnimalSpecies, ct);
        var patient = new HistoryPatientInfo(animal.Id, animal.Name, animal.PhotoUrl, animal.Species,
            speciesLabels.GetValueOrDefault(animal.Species, animal.Species),
            animal.Breed, animal.Sex, ClinicFormat.Sex(animal.Sex), animal.BirthDate, ClinicFormat.Age(animal.BirthDate, _clock.Today),
            animal.MicrochipNumber, animal.IsActive, animal.Allergies.Distinct().ToList(), animal.ChronicConditions.Distinct().ToList(),
            owner is null ? null : new HistoryOwnerInfo(owner.Id, owner.Name, owner.Email, owner.PhoneNumber, owner.Address,
                owner.DocumentType is null ? null : string.IsNullOrWhiteSpace(owner.DocumentType.Abbreviation) ? owner.DocumentType.Name : owner.DocumentType.Abbreviation,
                owner.DocumentNumber),
            last?.VisitDate, last?.ClinicalServiceName, last?.Veterinarian);

        var hospitalizationRecords = hospitalizations.Select(h => new HistoryHospitalization(h.Id, h.AdmissionDate, h.DischargeDate, h.Status, h.Cause,
            h.ClinicalService?.Name, h.Attention?.AttendingEmployee?.FullName, h.AdmissionNotes,
            h.TreatmentSchedules.OrderBy(t => t.ScheduledTime).Select(t => new HistoryTreatmentSchedule(t.Id, t.TreatmentName, t.ScheduledTime,
                t.IsCompleted, t.CompletedAt, t.CompletedBy?.FullName, t.Notes,
                t.ProductUsages.Select(u => new HistoryTreatmentProductUsage(u.Id, u.ProductId, u.Product?.Name, u.Quantity, u.Unit)).ToList())).ToList(),
            h.EvolutionNotes.OrderBy(n => n.Timestamp).Select(n => new HistoryEvolutionNote(n.Id, n.Timestamp, n.Author?.FullName, n.Note)).ToList())).ToList();

        return new ClinicalHistoryDetailResponse(patient, last, consultationDtos, procedures,
            new HistoryPreventiveCare(vaccines, deworming, groomingEntries), labResults, weights, hospitalizationRecords);
    }

    private static HistoryConsultation ToConsultation(ClinicalAttention c)
    {
        Attentions a = c.Attention;
        string? reason = a.Appointment?.ClinicalDetail is { } detail
            ? detail.ConsultationReason
            : string.IsNullOrWhiteSpace(a.Service?.Description) ? null : a.Service!.Description;
        return new HistoryConsultation(c.Id, c.VisitDate, a.Service?.ClinicalServiceCategory, a.Service?.Name, a.AttendingEmployee?.FullName,
            a.Branch?.Name, reason, new HistoryVitals(c.WeightKg, c.TemperatureCelsius, c.HeartRate, c.RespiratoryRate), c.Subjective, c.Objective,
            c.Assessment, c.Plan, c.Objective,
            c.MedicationAdministrations.OrderByDescending(m => m.AdministeredAt).Select(m => new HistoryMedication(m.Id, m.Product?.Name, m.DoseAmount,
                m.DoseUnit?.ToString(), m.Route?.ToString(), m.FrequencyValue, m.FrequencyUnit?.ToString(), m.AdministeredAt,
                m.AdministeredBy?.FullName, m.Notes)).ToList(),
            c.ServiceItems.OrderBy(i => i.Id).Select(i => new HistoryServiceItem(i.Id, i.ClinicalService?.Name, i.ClinicalService?.ClinicalServiceCategory,
                i.Quantity, i.Subtotal, i.Notes)).ToList());
    }

    private static HistoryLabParameter ToLabParameter(LaboratoryResultValue v)
    {
        LaboratoryTestParameter? p = v.Parameter;
        string? unit = v.UnitOverride ?? p?.Unit.ToString();
        string? reference = null;
        if (p is not null)
        {
            if (!string.IsNullOrWhiteSpace(p.RefText)) reference = p.RefText;
            else if (p.RefMin is not null && p.RefMax is not null) reference = $"{ClinicFormat.Number(p.RefMin.Value, 2)} - {ClinicFormat.Number(p.RefMax.Value, 2)}";
            else if (p.RefMin is not null) reference = "Desde " + ClinicFormat.Number(p.RefMin.Value, 2);
            else if (p.RefMax is not null) reference = "Hasta " + ClinicFormat.Number(p.RefMax.Value, 2);
        }
        string? value = v.NumericValue is { } n ? ClinicFormat.Number(n, p?.Decimals ?? 2)
            : v.TextValue ?? (v.BooleanValue is { } b ? (b ? "Positivo" : "Negativo") : null);
        return new HistoryLabParameter(p?.Name, value, unit, reference, v.Flag, v.Comment);
    }
}
