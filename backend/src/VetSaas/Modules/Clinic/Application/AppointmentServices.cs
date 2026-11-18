using VetSaas.Modules.Preferences;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Modules.Customers.Application;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Clinic.Application;

internal static class Names
{
    public static string? Full(Employee? e) => e is null ? null : $"{e.FirstName?.Trim()} {e.LastName?.Trim()}".Trim();
    public static BranchResponse? Branch(Branch? b) => b is null ? null : BranchResponse.From(b);
}

// ---- DTOs de citas ----

public sealed record CreateClinicalAppointmentRequest(long? AnimalId, long? BranchId, long? ClinicalServiceId, long? VeterinarianId,
    DateTime? StartDateTime, int? EstimatedDurationMinutes, string? ConsultationReason, string? ClinicalNotes);

public sealed record CreateGroomingAppointmentRequest(long? AnimalId, long? BranchId, long? ClinicalServiceId, long? StylistId,
    DateTime? StartDateTime, int? EstimatedDurationMinutes, string? OwnerSpecialNotes);

public sealed record CreateSurgicalAppointmentRequest(long? AnimalId, long? BranchId, long? OrderId, long? FinalServiceId, long? SurgeonId,
    long? AnesthetistId, long? OperatingRoomId, DateTime? StartDateTime, int? EstimatedDurationMinutes, string? PrepInstructions);

public sealed record RescheduleAppointmentRequest(DateTime? StartDateTime, int? EstimatedDurationMinutes);
public sealed record UpdateAppointmentStatusRequest(AppointmentStatus? Status);
public sealed record AssignAppointmentEmployeeRequest(long? EmployeeId);

public sealed class CreateClinicalAppointmentValidator : AbstractValidator<CreateClinicalAppointmentRequest>
{
    public CreateClinicalAppointmentValidator()
    {
        RuleFor(r => r.AnimalId).NotNull().WithMessage("El paciente es obligatorio");
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sucursal es obligatoria");
        RuleFor(r => r.ClinicalServiceId).NotNull().WithMessage("El servicio es obligatorio");
        RuleFor(r => r.VeterinarianId).NotNull().WithMessage("El veterinario es obligatorio");
        RuleFor(r => r.StartDateTime).NotNull().WithMessage("La fecha y hora de la cita es obligatoria");
        RuleFor(r => r.EstimatedDurationMinutes).GreaterThan(0).When(r => r.EstimatedDurationMinutes is not null).WithMessage("La duración debe ser positiva");
    }
}

public sealed class CreateGroomingAppointmentValidator : AbstractValidator<CreateGroomingAppointmentRequest>
{
    public CreateGroomingAppointmentValidator()
    {
        RuleFor(r => r.AnimalId).NotNull().WithMessage("El paciente es obligatorio");
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sucursal es obligatoria");
        RuleFor(r => r.ClinicalServiceId).NotNull().WithMessage("El servicio es obligatorio");
        RuleFor(r => r.StylistId).NotNull().WithMessage("El estilista es obligatorio");
        RuleFor(r => r.StartDateTime).NotNull().WithMessage("La fecha y hora de la cita es obligatoria");
        RuleFor(r => r.EstimatedDurationMinutes).GreaterThan(0).When(r => r.EstimatedDurationMinutes is not null).WithMessage("La duración debe ser positiva");
    }
}

public sealed class CreateSurgicalAppointmentValidator : AbstractValidator<CreateSurgicalAppointmentRequest>
{
    public CreateSurgicalAppointmentValidator()
    {
        RuleFor(r => r.AnimalId).NotNull().WithMessage("El paciente es obligatorio");
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sucursal es obligatoria");
        RuleFor(r => r.FinalServiceId).NotNull().WithMessage("El servicio es obligatorio");
        RuleFor(r => r.SurgeonId).NotNull().WithMessage("El cirujano es obligatorio");
        RuleFor(r => r.StartDateTime).NotNull().WithMessage("La fecha y hora de la cita es obligatoria");
        RuleFor(r => r.EstimatedDurationMinutes).GreaterThan(0).When(r => r.EstimatedDurationMinutes is not null).WithMessage("La duración debe ser positiva");
    }
}

public sealed class RescheduleAppointmentValidator : AbstractValidator<RescheduleAppointmentRequest>
{
    public RescheduleAppointmentValidator()
    {
        RuleFor(r => r.StartDateTime).NotNull().WithMessage("La fecha y hora de la cita es obligatoria");
        RuleFor(r => r.EstimatedDurationMinutes).GreaterThan(0).When(r => r.EstimatedDurationMinutes is not null).WithMessage("La duración debe ser positiva");
    }
}

public sealed class UpdateAppointmentStatusValidator : AbstractValidator<UpdateAppointmentStatusRequest>
{
    public UpdateAppointmentStatusValidator() => RuleFor(r => r.Status).NotNull().WithMessage("El estado es obligatorio");
}

public sealed class AssignAppointmentEmployeeValidator : AbstractValidator<AssignAppointmentEmployeeRequest>
{
    public AssignAppointmentEmployeeValidator() => RuleFor(r => r.EmployeeId).NotNull().WithMessage("El empleado es obligatorio");
}

public sealed record ClinicalAppointmentDetailResponse(long ClinicalServiceId, string ClinicalServiceName, long VeterinarianId,
    string? VeterinarianFullName, string? ConsultationReason, string? ClinicalNotes);

public sealed record GroomingAppointmentDetailResponse(long ClinicalServiceId, string ClinicalServiceName, long StylistId,
    string? StylistFullName, string? OwnerSpecialNotes);

public sealed record SurgicalAppointmentDetailResponse(long? OrderId, long FinalServiceId, string FinalServiceName, long SurgeonId,
    string? SurgeonFullName, long? AnesthetistId, string? AnesthetistFullName, long? OperatingRoomId, string? OperatingRoomName,
    string? PrepInstructions);

public sealed record AppointmentSummaryResponse(long Id, AppointmentType Type, AppointmentStatus Status, DateTime StartDateTime,
    int? EstimatedDurationMinutes, BranchResponse? Branch, long AnimalId, string AnimalName, long? AssignedEmployeeId,
    string? AssignedEmployeeFullName);

public sealed record AppointmentDetailResponse(long Id, AppointmentType Type, AppointmentStatus Status, DateTime StartDateTime,
    int? EstimatedDurationMinutes, BranchResponse? Branch, long AnimalId, string AnimalName, long? AssignedEmployeeId,
    string? AssignedEmployeeFullName, string? RequesterName, string? RequesterEmail, string? RequesterPhone, string? RequestNotes,
    ClinicalAppointmentDetailResponse? ClinicalDetail, GroomingAppointmentDetailResponse? GroomingDetail,
    SurgicalAppointmentDetailResponse? SurgicalDetail);

public interface IAppointmentService
{
    Task<AppointmentDetailResponse> CreateClinicalAsync(CreateClinicalAppointmentRequest r, CancellationToken ct = default);
    Task<AppointmentDetailResponse> CreateGroomingAsync(CreateGroomingAppointmentRequest r, CancellationToken ct = default);
    Task<AppointmentDetailResponse> CreateSurgicalAsync(CreateSurgicalAppointmentRequest r, CancellationToken ct = default);
    Task<List<AppointmentSummaryResponse>> ListAsync(AppointmentType? type, AppointmentStatus? status, DateOnly? startDate, DateOnly? endDate, long? assignedEmployeeId, CancellationToken ct = default);
    Task<AppointmentDetailResponse> GetAsync(long id, CancellationToken ct = default);
    Task<AppointmentDetailResponse> RescheduleAsync(long id, RescheduleAppointmentRequest r, CancellationToken ct = default);
    Task<AppointmentDetailResponse> UpdateStatusAsync(long id, AppointmentStatus status, CancellationToken ct = default);
    Task<AppointmentDetailResponse> AssignEmployeeAsync(long id, long employeeId, CancellationToken ct = default);
    Task DeleteAsync(long id, CancellationToken ct = default);
}

public sealed class AppointmentService : IAppointmentService
{
    private static readonly AppointmentStatus[] Flow =
    {
        AppointmentStatus.REQUESTED, AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED,
        AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED,
    };

    private readonly TenantDbContext _db;
    private readonly IClock _clock;

    private readonly IPreferenceService _prefs;

    public AppointmentService(TenantDbContext db, IClock clock, IPreferenceService prefs)
    {
        _db = db;
        _clock = clock;
        _prefs = prefs;
    }

    internal static bool IsFinal(AppointmentStatus s) => s is AppointmentStatus.COMPLETED or AppointmentStatus.CANCELED or AppointmentStatus.NO_SHOW;

    private IQueryable<Appointment> Full() => _db.Appointments
        .Include(a => a.Animal).Include(a => a.AssignedEmployee).Include(a => a.Branch)
        .Include(a => a.ClinicalDetail!).ThenInclude(d => d.ClinicalService)
        .Include(a => a.ClinicalDetail!).ThenInclude(d => d.Veterinarian)
        .Include(a => a.GroomingDetail!).ThenInclude(d => d.ClinicalService)
        .Include(a => a.GroomingDetail!).ThenInclude(d => d.Stylist)
        .Include(a => a.SurgicalDetail!).ThenInclude(d => d.FinalService)
        .Include(a => a.SurgicalDetail!).ThenInclude(d => d.Surgeon)
        .Include(a => a.SurgicalDetail!).ThenInclude(d => d.Anesthetist)
        .Include(a => a.SurgicalDetail!).ThenInclude(d => d.OperatingRoom)
        .Include(a => a.SurgicalDetail!).ThenInclude(d => d.Order)
        .AsSplitQuery();

    private async Task<Appointment> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(a => a.Id == id, ct) ?? throw new InvalidArgumentException("Cita no encontrada: id=" + id);

    internal static AppointmentSummaryResponse ToSummary(Appointment a) => new(a.Id, a.Type, a.Status, a.StartDateTime,
        a.EstimatedDurationMinutes, Names.Branch(a.Branch), a.AnimalId, a.Animal.Name, a.AssignedEmployeeId, Names.Full(a.AssignedEmployee));

    internal static AppointmentDetailResponse ToDetail(Appointment a)
    {
        var c = a.ClinicalDetail;
        var g = a.GroomingDetail;
        var s = a.SurgicalDetail;
        return new AppointmentDetailResponse(a.Id, a.Type, a.Status, a.StartDateTime, a.EstimatedDurationMinutes, Names.Branch(a.Branch),
            a.AnimalId, a.Animal.Name, a.AssignedEmployeeId, Names.Full(a.AssignedEmployee), a.RequesterName, a.RequesterEmail,
            a.RequesterPhone, a.RequestNotes,
            c is null ? null : new ClinicalAppointmentDetailResponse(c.ClinicalServiceId, c.ClinicalService.Name, c.VeterinarianId,
                Names.Full(c.Veterinarian), c.ConsultationReason, c.ClinicalNotes),
            g is null ? null : new GroomingAppointmentDetailResponse(g.ClinicalServiceId, g.ClinicalService.Name, g.StylistId,
                Names.Full(g.Stylist), g.OwnerSpecialNotes),
            s is null ? null : new SurgicalAppointmentDetailResponse(s.OrderId, s.FinalServiceId, s.FinalService.Name, s.SurgeonId,
                Names.Full(s.Surgeon), s.AnesthetistId, Names.Full(s.Anesthetist), s.OperatingRoomId, s.OperatingRoom?.Name, s.PrepInstructions));
    }

    private async Task<T> FindAsync<T>(IQueryable<T> set, long? id, string label, CancellationToken ct) where T : class =>
        await set.FirstOrDefaultAsync(e => EF.Property<long>(e, "Id") == id, ct) ?? throw new InvalidArgumentException($"{label} no encontrado: id={id}");

    private Task<Animal> AnimalAsync(long? id, CancellationToken ct) => FindAsync(_db.Animals, id, "Animal", ct);
    private Task<Employee> EmployeeAsync(long? id, CancellationToken ct) => FindAsync(_db.Employees, id, "Empleado", ct);
    private Task<ClinicalService> ServiceAsync(long? id, CancellationToken ct) => FindAsync(_db.ClinicalServices, id, "Servicio clínico", ct);
    private async Task<Branch> BranchAsync(long? id, CancellationToken ct) =>
        await _db.Branches.FirstOrDefaultAsync(b => b.Id == id, ct) ?? throw new InvalidArgumentException("Sucursal no encontrada: id=" + id);

    /// <summary>Valida que la cita no esté en el pasado ni se cruce con otra del profesional, el paciente o el quirófano.</summary>
    private async Task AssertSchedulableAsync(DateTime? start, int? duration, long? employeeId, long? animalId, long? roomId,
        long? excludeId, CancellationToken ct)
    {
        if (start is null) throw new InvalidArgumentException("La fecha y hora de la cita es obligatoria");
        // Preferencias de la sucursal (por defecto 30 y 30 minutos, como antes).
        int pastTolerance = await _prefs.IntAsync(Prefs.PastTolerance, ct: ct);
        int assumedDuration = await _prefs.IntAsync(Prefs.AssumedAppointmentDuration, ct: ct);
        if (start < _clock.Now.AddMinutes(-pastTolerance))
            throw new InvalidArgumentException("No se puede agendar una cita en una fecha/hora pasada");
        DateTime end = start.Value.AddMinutes(duration ?? assumedDuration);
        DateTime from = start.Value.AddHours(-12);

        var candidates = await _db.Appointments.AsNoTracking()
            .Include(a => a.SurgicalDetail)
            .Where(a => a.Status != AppointmentStatus.CANCELED && a.Status != AppointmentStatus.COMPLETED && a.Status != AppointmentStatus.NO_SHOW)
            .Where(a => a.StartDateTime >= from && a.StartDateTime < end)
            .Where(a => (employeeId != null && a.AssignedEmployeeId == employeeId) || (animalId != null && a.AnimalId == animalId) ||
                        (roomId != null && a.SurgicalDetail != null && a.SurgicalDetail.OperatingRoomId == roomId))
            .ToListAsync(ct);

        foreach (Appointment other in candidates)
        {
            if (excludeId == other.Id) continue;
            DateTime otherEnd = other.StartDateTime.AddMinutes(other.EstimatedDurationMinutes ?? assumedDuration);
            if (!(start < otherEnd && other.StartDateTime < end)) continue;
            if (employeeId is not null && other.AssignedEmployeeId == employeeId)
                throw new BusinessRuleException($"El profesional ya tiene una cita en ese horario ({other.StartDateTime:HH:mm} - {otherEnd:HH:mm})");
            if (animalId is not null && other.AnimalId == animalId)
                throw new BusinessRuleException("El paciente ya tiene una cita en ese horario");
            if (roomId is not null && other.SurgicalDetail?.OperatingRoomId == roomId)
                throw new BusinessRuleException("El quirófano ya está reservado en ese horario");
        }
    }

    private Appointment NewAppointment(Animal animal, Branch branch, Employee employee, DateTime start, int? duration, AppointmentType type) =>
        new()
        {
            Animal = animal, Branch = branch, AssignedEmployee = employee, StartDateTime = start,
            EstimatedDurationMinutes = duration, Type = type, Status = AppointmentStatus.SCHEDULED,
        };

    public Task<AppointmentDetailResponse> CreateClinicalAsync(CreateClinicalAppointmentRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Animal animal = await AnimalAsync(r.AnimalId, ct);
            ClinicalService service = await ServiceAsync(r.ClinicalServiceId, ct);
            Employee vet = await EmployeeAsync(r.VeterinarianId, ct);
            Branch branch = await BranchAsync(r.BranchId, ct);
            await AssertSchedulableAsync(r.StartDateTime, r.EstimatedDurationMinutes, vet.Id, animal.Id, null, null, ct);
            Appointment appointment = NewAppointment(animal, branch, vet, r.StartDateTime!.Value, r.EstimatedDurationMinutes, AppointmentType.CLINIC);
            appointment.ClinicalDetail = new ClinicalAppointmentDetail
            {
                Appointment = appointment, ClinicalService = service, Veterinarian = vet,
                ConsultationReason = r.ConsultationReason, ClinicalNotes = r.ClinicalNotes,
            };
            _db.Appointments.Add(appointment);
            await _db.SaveChangesAsync(ct);
            return await GetAsync(appointment.Id, ct);
        }, ct);

    public Task<AppointmentDetailResponse> CreateGroomingAsync(CreateGroomingAppointmentRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Animal animal = await AnimalAsync(r.AnimalId, ct);
            ClinicalService service = await ServiceAsync(r.ClinicalServiceId, ct);
            Employee stylist = await EmployeeAsync(r.StylistId, ct);
            Branch branch = await BranchAsync(r.BranchId, ct);
            await AssertSchedulableAsync(r.StartDateTime, r.EstimatedDurationMinutes, stylist.Id, animal.Id, null, null, ct);
            Appointment appointment = NewAppointment(animal, branch, stylist, r.StartDateTime!.Value, r.EstimatedDurationMinutes, AppointmentType.GROOMING);
            appointment.GroomingDetail = new GroomingAppointmentDetail
            {
                Appointment = appointment, ClinicalService = service, Stylist = stylist, OwnerSpecialNotes = r.OwnerSpecialNotes,
            };
            _db.Appointments.Add(appointment);
            await _db.SaveChangesAsync(ct);
            return await GetAsync(appointment.Id, ct);
        }, ct);

    public Task<AppointmentDetailResponse> CreateSurgicalAsync(CreateSurgicalAppointmentRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Animal animal = await AnimalAsync(r.AnimalId, ct);
            SurgicalOrder? order = null;
            if (r.OrderId is not null)
            {
                order = await _db.SurgicalOrders.Include(o => o.ScheduledDetail).FirstOrDefaultAsync(o => o.Id == r.OrderId, ct)
                    ?? throw new InvalidArgumentException("Orden quirúrgica no encontrada: id=" + r.OrderId);
                if (order.AnimalId != animal.Id) throw new InvalidArgumentException("La orden quirúrgica no corresponde al animal indicado.");
                if (order.ScheduledDetail is not null) throw new BusinessRuleException("La orden quirúrgica ya tiene una cita asignada.");
            }
            ClinicalService finalService = await ServiceAsync(r.FinalServiceId, ct);
            Employee surgeon = await EmployeeAsync(r.SurgeonId, ct);
            Employee? anesthetist = r.AnesthetistId is null ? null : await EmployeeAsync(r.AnesthetistId, ct);
            Branch branch = await BranchAsync(r.BranchId, ct);
            OperatingRoom? room = r.OperatingRoomId is null
                ? null
                : await _db.OperatingRooms.FirstOrDefaultAsync(o => o.Id == r.OperatingRoomId, ct)
                  ?? throw new InvalidArgumentException("Quirófano no encontrado: id=" + r.OperatingRoomId);
            await AssertSchedulableAsync(r.StartDateTime, r.EstimatedDurationMinutes, surgeon.Id, animal.Id, room?.Id, null, ct);

            Appointment appointment = NewAppointment(animal, branch, surgeon, r.StartDateTime!.Value, r.EstimatedDurationMinutes, AppointmentType.SURGERY);
            appointment.SurgicalDetail = new SurgicalAppointmentDetail
            {
                Appointment = appointment, Order = order, FinalService = finalService, Surgeon = surgeon,
                Anesthetist = anesthetist, OperatingRoom = room, PrepInstructions = r.PrepInstructions,
            };
            if (order is not null) order.Status = SurgicalOrderStatus.SCHEDULED;
            _db.Appointments.Add(appointment);
            await _db.SaveChangesAsync(ct);
            return await GetAsync(appointment.Id, ct);
        }, ct);

    public async Task<List<AppointmentSummaryResponse>> ListAsync(AppointmentType? type, AppointmentStatus? status, DateOnly? startDate,
        DateOnly? endDate, long? assignedEmployeeId, CancellationToken ct = default)
    {
        IQueryable<Appointment> query = _db.Appointments.AsNoTracking().Include(a => a.Branch).Include(a => a.Animal).Include(a => a.AssignedEmployee);
        if (type is not null) query = query.Where(a => a.Type == type);
        if (status is not null) query = query.Where(a => a.Status == status);
        if (startDate is not null)
        {
            DateTime from = startDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(a => a.StartDateTime >= from);
        }
        if (endDate is not null)
        {
            DateTime to = endDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(a => a.StartDateTime < to);
        }
        if (assignedEmployeeId is not null) query = query.Where(a => a.AssignedEmployeeId == assignedEmployeeId);
        return (await query.OrderBy(a => a.StartDateTime).ThenBy(a => a.Id).ToListAsync(ct)).Select(ToSummary).ToList();
    }

    public async Task<AppointmentDetailResponse> GetAsync(long id, CancellationToken ct = default) =>
        ToDetail(await Full().AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct) ?? throw new InvalidArgumentException("Cita no encontrada: id=" + id));

    public Task<AppointmentDetailResponse> RescheduleAsync(long id, RescheduleAppointmentRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Appointment a = await RequireAsync(id, ct);
            if (IsFinal(a.Status))
                throw new BusinessRuleException("No se puede reprogramar una cita " + a.Status.ToString().ToLowerInvariant());
            int? duration = r.EstimatedDurationMinutes ?? a.EstimatedDurationMinutes;
            await AssertSchedulableAsync(r.StartDateTime, duration, a.AssignedEmployeeId, a.AnimalId, a.SurgicalDetail?.OperatingRoomId, a.Id, ct);
            a.StartDateTime = r.StartDateTime!.Value;
            if (r.EstimatedDurationMinutes is not null) a.EstimatedDurationMinutes = r.EstimatedDurationMinutes;
            await _db.SaveChangesAsync(ct);
            return ToDetail(a);
        }, ct);

    public Task<AppointmentDetailResponse> UpdateStatusAsync(long id, AppointmentStatus status, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Appointment a = await RequireAsync(id, ct);
            if (a.Status != status)
            {
                if (IsFinal(a.Status))
                    throw new BusinessRuleException($"La cita ya está {a.Status.ToString().ToLowerInvariant()} y no puede cambiar de estado");
                if (status is not (AppointmentStatus.CANCELED or AppointmentStatus.NO_SHOW) &&
                    Array.IndexOf(Flow, status) < Array.IndexOf(Flow, a.Status))
                    throw new BusinessRuleException($"No se puede retroceder una cita de {a.Status} a {status}");
            }
            a.Status = status;
            await _db.SaveChangesAsync(ct);
            return ToDetail(a);
        }, ct);

    public Task<AppointmentDetailResponse> AssignEmployeeAsync(long id, long employeeId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Appointment a = await RequireAsync(id, ct);
            Employee employee = await EmployeeAsync(employeeId, ct);
            if (IsFinal(a.Status))
                throw new BusinessRuleException("No se puede reasignar una cita " + a.Status.ToString().ToLowerInvariant());
            await AssertSchedulableAsync(a.StartDateTime, a.EstimatedDurationMinutes, employee.Id, null, null, a.Id, ct);
            a.AssignedEmployee = employee;
            switch (a.Type)
            {
                case AppointmentType.CLINIC:
                    (a.ClinicalDetail ?? throw new BusinessRuleException("La cita clínica no tiene detalle asociado.")).Veterinarian = employee;
                    break;
                case AppointmentType.GROOMING:
                    (a.GroomingDetail ?? throw new BusinessRuleException("La cita de grooming no tiene detalle asociado.")).Stylist = employee;
                    break;
                case AppointmentType.SURGERY:
                    (a.SurgicalDetail ?? throw new BusinessRuleException("La cita quirúrgica no tiene detalle asociado.")).Surgeon = employee;
                    break;
            }
            await _db.SaveChangesAsync(ct);
            return ToDetail(a);
        }, ct);

    public Task DeleteAsync(long id, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Appointment a = await RequireAsync(id, ct);
            if (a.SurgicalDetail?.Order is { } order) order.Status = SurgicalOrderStatus.PENDING;
            _db.Appointments.Remove(a);
            await _db.SaveChangesAsync(ct);
        }, ct);
}

// ---- Recepción (atenciones) ----

public sealed record CreateAttentionRequest(long? BranchId, long? AnimalId, long? AttendingEmployeeId, DateTime? CheckInTime,
    AttentionType? Type, AttentionsStatus? Status, long? ClinicalServiceId, bool? Emergency);

public sealed record CreateAttentionFromAppointmentRequest(long? AppointmentId, long? AttendingEmployeeId, DateTime? CheckInTime,
    bool? Emergency, AttentionsStatus? Status);

public sealed record UpdateAttentionStatusRequest(AttentionsStatus? Status);
public sealed record UpdateAttentionAttendingEmployeeRequest(long? AttendingEmployeeId);

public sealed class CreateAttentionValidator : AbstractValidator<CreateAttentionRequest>
{
    public CreateAttentionValidator()
    {
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sucursal es obligatoria");
        RuleFor(r => r.AnimalId).NotNull().WithMessage("El paciente es obligatorio");
        RuleFor(r => r.AttendingEmployeeId).NotNull().WithMessage("El responsable es obligatorio");
        RuleFor(r => r.CheckInTime).NotNull().WithMessage("La hora de llegada es obligatoria");
        RuleFor(r => r.Type).NotNull().WithMessage("El tipo de atención es obligatorio");
        RuleFor(r => r.Status).NotNull().WithMessage("El estado es obligatorio");
        RuleFor(r => r.ClinicalServiceId).NotNull().WithMessage("El servicio es obligatorio");
    }
}

public sealed class CreateAttentionFromAppointmentValidator : AbstractValidator<CreateAttentionFromAppointmentRequest>
{
    public CreateAttentionFromAppointmentValidator() => RuleFor(r => r.AppointmentId).NotNull().WithMessage("La cita es obligatoria");
}

public sealed class UpdateAttentionStatusValidator : AbstractValidator<UpdateAttentionStatusRequest>
{
    public UpdateAttentionStatusValidator() => RuleFor(r => r.Status).NotNull().WithMessage("El estado es obligatorio");
}

public sealed class UpdateAttentionAttendingEmployeeValidator : AbstractValidator<UpdateAttentionAttendingEmployeeRequest>
{
    public UpdateAttentionAttendingEmployeeValidator() => RuleFor(r => r.AttendingEmployeeId).NotNull().WithMessage("El responsable es obligatorio");
}

public sealed record AttentionResponse(long Id, long? AppointmentId, BranchResponse? Branch, AnimalBasicResponse AnimalBasicResponse,
    long AttendingEmployeeId, string? AttendingEmployeeFullName, DateTime CheckInTime, AttentionType? Type, bool Emergency,
    AttentionsStatus Status, long? ClinicalServiceId, string? ClinicalServiceName);

public sealed record AttentionSummaryResponse(long Id, DateTime CheckInTime, AttentionsStatus Status, AttentionType? Type, bool Emergency,
    long AnimalId, string AnimalName, long BranchId, string BranchName, long AttendingEmployeeId, string? AttendingEmployeeFullName,
    long? ClinicalServiceId, string? ClinicalServiceName, long? AppointmentId, long? SurgicalOrderId);

internal static class AttentionMapping
{
    public static AttentionResponse ToResponse(Attentions a) => new(a.Id, a.AppointmentId, Names.Branch(a.Branch),
        AnimalBasicResponse.From(a.Animal), a.AttendingEmployeeId, Names.Full(a.AttendingEmployee), a.CheckInTime, a.Type, a.IsEmergency,
        a.Status, a.ServiceId, a.Service?.Name);

    public static AttentionSummaryResponse ToSummary(Attentions a) => new(a.Id, a.CheckInTime, a.Status, a.Type, a.IsEmergency,
        a.AnimalId, a.Animal.Name, a.BranchId, a.Branch.Name, a.AttendingEmployeeId, Names.Full(a.AttendingEmployee), a.ServiceId,
        a.Service?.Name, a.AppointmentId, a.SurgicalOrderId);

    /// <summary>La cita sigue a la atención: llegada → CHECKED_IN, en curso → IN_PROGRESS, finalizada → COMPLETED.</summary>
    public static void SyncAppointment(Attentions a)
    {
        if (a.Appointment is null) return;
        a.Appointment.Status = a.Status switch
        {
            AttentionsStatus.WAITING => AppointmentStatus.CHECKED_IN,
            AttentionsStatus.FINISHED => AppointmentStatus.COMPLETED,
            _ => AppointmentStatus.IN_PROGRESS,
        };
    }
}

public interface IAttentionService
{
    Task<PaginatedResponse<AttentionResponse>> ListAsync(AttentionType? type, AttentionsStatus? status, long? branchId, long? animalId,
        bool? emergency, long? appointmentId, long? clinicalServiceId, DateOnly? startDate, DateOnly? endDate, int page, int size, CancellationToken ct = default);
    Task<AttentionResponse> GetAsync(long id, CancellationToken ct = default);
    Task<AttentionResponse> CreateAsync(CreateAttentionRequest r, CancellationToken ct = default);
    Task<AttentionResponse> CreateFromAppointmentAsync(CreateAttentionFromAppointmentRequest r, CancellationToken ct = default);
    Task<AttentionResponse> UpdateStatusAsync(long id, AttentionsStatus status, CancellationToken ct = default);
    Task<AttentionResponse> UpdateAttendingEmployeeAsync(long id, long employeeId, CancellationToken ct = default);
    Task DeleteAsync(long id, CancellationToken ct = default);
}

public sealed class AttentionService : IAttentionService
{
    private readonly TenantDbContext _db;
    private readonly IClock _clock;

    public AttentionService(TenantDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    private IQueryable<Attentions> Full() => _db.Attentions
        .Include(a => a.Appointment).Include(a => a.Branch).Include(a => a.Animal)
        .Include(a => a.AttendingEmployee).Include(a => a.Service);

    private async Task<Attentions> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(a => a.Id == id, ct) ?? throw new InvalidArgumentException("Atención no encontrada: id=" + id);

    public async Task<PaginatedResponse<AttentionResponse>> ListAsync(AttentionType? type, AttentionsStatus? status, long? branchId,
        long? animalId, bool? emergency, long? appointmentId, long? clinicalServiceId, DateOnly? startDate, DateOnly? endDate, int page,
        int size, CancellationToken ct = default)
    {
        IQueryable<Attentions> query = Full().AsNoTracking();
        if (type is not null) query = query.Where(a => a.Type == type);
        if (status is not null) query = query.Where(a => a.Status == status);
        if (branchId is not null) query = query.Where(a => a.BranchId == branchId);
        if (animalId is not null) query = query.Where(a => a.AnimalId == animalId);
        if (emergency is not null) query = query.Where(a => a.IsEmergency == emergency);
        if (appointmentId is not null) query = query.Where(a => a.AppointmentId == appointmentId);
        if (clinicalServiceId is not null) query = query.Where(a => a.ServiceId == clinicalServiceId);
        if (startDate is not null)
        {
            DateTime from = startDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(a => a.CheckInTime >= from);
        }
        if (endDate is not null)
        {
            DateTime to = endDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(a => a.CheckInTime < to);
        }
        var result = await query.OrderByDescending(a => a.CheckInTime).ThenByDescending(a => a.Id).ToPageAsync(page, size, ct);
        return result.Map(AttentionMapping.ToResponse);
    }

    public async Task<AttentionResponse> GetAsync(long id, CancellationToken ct = default) =>
        AttentionMapping.ToResponse(await Full().AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct)
                                    ?? throw new InvalidArgumentException("Atención no encontrada: id=" + id));

    /// <summary>Un paciente no puede tener dos atenciones abiertas del mismo tipo.</summary>
    private async Task AssertNoOpenAttentionAsync(long animalId, AttentionType? type, CancellationToken ct)
    {
        if (await _db.Attentions.AnyAsync(a => a.AnimalId == animalId && a.Type == type && a.Status != AttentionsStatus.FINISHED, ct))
            throw new BusinessRuleException($"El paciente ya tiene una atención de tipo {type} abierta");
    }

    public Task<AttentionResponse> CreateAsync(CreateAttentionRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            var branch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == r.BranchId, ct) ?? throw new InvalidArgumentException("Sucursal no encontrada: id=" + r.BranchId);
            var animal = await _db.Animals.FirstOrDefaultAsync(a => a.Id == r.AnimalId, ct) ?? throw new InvalidArgumentException("Animal no encontrado: id=" + r.AnimalId);
            var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.AttendingEmployeeId, ct) ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + r.AttendingEmployeeId);
            var service = await _db.ClinicalServices.FirstOrDefaultAsync(s => s.Id == r.ClinicalServiceId, ct) ?? throw new InvalidArgumentException("Servicio clínico no encontrado: id=" + r.ClinicalServiceId);
            if (r.Type == AttentionType.SURGERY && service.ClinicalServiceCategory != ClinicalServiceCategory.SURGERY)
                throw new ValidationFailedException("Si la atención es quirúrgica y hay servicio, este debe ser de categoría SURGERY");
            await AssertNoOpenAttentionAsync(animal.Id, r.Type, ct);
            var attention = new Attentions
            {
                Branch = branch, Animal = animal, AttendingEmployee = employee, CheckInTime = r.CheckInTime!.Value, Type = r.Type,
                IsEmergency = r.Emergency == true, Status = r.Status!.Value, Service = service,
            };
            _db.Attentions.Add(attention);
            await _db.SaveChangesAsync(ct);
            return AttentionMapping.ToResponse(attention);
        }, ct);

    public Task<AttentionResponse> CreateFromAppointmentAsync(CreateAttentionFromAppointmentRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Appointment appointment = await _db.Appointments
                                          .Include(a => a.Branch).Include(a => a.Animal).Include(a => a.AssignedEmployee)
                                          .Include(a => a.ClinicalDetail!).ThenInclude(d => d.ClinicalService)
                                          .Include(a => a.GroomingDetail!).ThenInclude(d => d.ClinicalService)
                                          .Include(a => a.SurgicalDetail!).ThenInclude(d => d.FinalService)
                                          .Include(a => a.SurgicalDetail!).ThenInclude(d => d.Order)
                                          .AsSplitQuery()
                                          .FirstOrDefaultAsync(a => a.Id == r.AppointmentId, ct)
                                      ?? throw new InvalidArgumentException("Cita no encontrada: id=" + r.AppointmentId);
            if (await _db.Attentions.AnyAsync(a => a.AppointmentId == appointment.Id, ct))
                throw new BusinessRuleException("La cita ya tiene una atención registrada.");

            Employee attending = r.AttendingEmployeeId is not null
                ? await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.AttendingEmployeeId, ct) ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + r.AttendingEmployeeId)
                : appointment.AssignedEmployee ?? throw new InvalidArgumentException("Debe indicar un empleado responsable para registrar la atención.");
            appointment.AssignedEmployee ??= attending;

            AttentionType type = appointment.Type switch
            {
                AppointmentType.CLINIC => AttentionType.CLINIC,
                AppointmentType.GROOMING => AttentionType.GROOMING,
                _ => AttentionType.SURGERY,
            };
            await AssertNoOpenAttentionAsync(appointment.AnimalId, type, ct);
            ClinicalService service = appointment.Type switch
            {
                AppointmentType.CLINIC => appointment.ClinicalDetail?.ClinicalService,
                AppointmentType.GROOMING => appointment.GroomingDetail?.ClinicalService,
                _ => appointment.SurgicalDetail?.FinalService,
            } ?? throw new BusinessRuleException("No se pudo determinar el servicio clínico asociado a la cita.");
            SurgicalOrder? order = null;
            if (appointment.Type == AppointmentType.SURGERY)
                order = (appointment.SurgicalDetail ?? throw new BusinessRuleException("La cita quirúrgica no tiene detalle registrado.")).Order;

            var attention = new Attentions
            {
                Appointment = appointment, Branch = appointment.Branch, Animal = appointment.Animal, AttendingEmployee = attending,
                CheckInTime = r.CheckInTime ?? _clock.Now, Type = type, IsEmergency = r.Emergency == true,
                Status = r.Status ?? AttentionsStatus.WAITING, Service = service, SurgicalOrder = order,
            };
            AttentionMapping.SyncAppointment(attention);
            _db.Attentions.Add(attention);
            await _db.SaveChangesAsync(ct);
            return AttentionMapping.ToResponse(attention);
        }, ct);

    public Task<AttentionResponse> UpdateStatusAsync(long id, AttentionsStatus status, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Attentions attention = await RequireAsync(id, ct);
            if (attention.Status != status)
            {
                if (attention.Status == AttentionsStatus.FINISHED)
                    throw new BusinessRuleException("La atención ya está finalizada y no puede cambiar de estado");
                if (status == AttentionsStatus.WAITING)
                    throw new BusinessRuleException("No se puede regresar una atención a 'en espera'");
            }
            attention.Status = status;
            AttentionMapping.SyncAppointment(attention);
            await _db.SaveChangesAsync(ct);
            return AttentionMapping.ToResponse(attention);
        }, ct);

    public Task<AttentionResponse> UpdateAttendingEmployeeAsync(long id, long employeeId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Attentions attention = await RequireAsync(id, ct);
            Employee employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == employeeId, ct)
                ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + employeeId);
            attention.AttendingEmployee = employee;
            if (attention.Appointment is not null) attention.Appointment.AssignedEmployee = employee;
            await _db.SaveChangesAsync(ct);
            return AttentionMapping.ToResponse(attention);
        }, ct);

    public Task DeleteAsync(long id, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            Attentions attention = await RequireAsync(id, ct);
            if (attention.Status != AttentionsStatus.WAITING)
                throw new BusinessRuleException("Solo se puede eliminar una recepción en espera. Esta atención ya está " +
                                                (attention.Status == AttentionsStatus.FINISHED ? "finalizada" : "en curso"));
            if (attention.Appointment is not null) attention.Appointment.Status = AppointmentStatus.SCHEDULED;
            _db.Attentions.Remove(attention);
            await _db.SaveChangesAsync(ct);
        }, ct);
}
