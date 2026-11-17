using VetSaas.Modules.Clinic.Application;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Shared.Infrastructure.Http;
using VetSaas.Shared.Infrastructure.Validation;

namespace VetSaas.Modules.Clinic.Endpoints;

public static class CareEndpoints
{
    public static void MapClinicCareEndpoints(this WebApplication app)
    {
        // ---- Citas ----
        var appointments = app.MapGroup("/api/appointments").WithTags("Appointments");

        appointments.MapGet("/", async (IAppointmentService s, CancellationToken ct, AppointmentType? type = null, AppointmentStatus? status = null,
                DateOnly? startDate = null, DateOnly? endDate = null, long? assignedEmployeeId = null) =>
            Results.Ok(await s.ListAsync(type, status, startDate, endDate, assignedEmployeeId, ct)));
        appointments.MapGet("/{id:long}", async (long id, IAppointmentService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        appointments.MapPost("/clinical", async (CreateClinicalAppointmentRequest r, IAppointmentService s, CancellationToken ct) =>
            Results.Ok(await s.CreateClinicalAsync(r, ct))).Validate<CreateClinicalAppointmentRequest>();
        appointments.MapPost("/grooming", async (CreateGroomingAppointmentRequest r, IAppointmentService s, CancellationToken ct) =>
            Results.Ok(await s.CreateGroomingAsync(r, ct))).Validate<CreateGroomingAppointmentRequest>();
        appointments.MapPost("/surgical", async (CreateSurgicalAppointmentRequest r, IAppointmentService s, CancellationToken ct) =>
            Results.Ok(await s.CreateSurgicalAsync(r, ct))).Validate<CreateSurgicalAppointmentRequest>();
        appointments.MapPatch("/{id:long}/reschedule", async (long id, RescheduleAppointmentRequest r, IAppointmentService s, CancellationToken ct) =>
            Results.Ok(await s.RescheduleAsync(id, r, ct))).Validate<RescheduleAppointmentRequest>();
        appointments.MapPatch("/{id:long}/status", async (long id, UpdateAppointmentStatusRequest r, IAppointmentService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateStatusAsync(id, r.Status!.Value, ct))).Validate<UpdateAppointmentStatusRequest>();
        appointments.MapPatch("/{id:long}/assign-employee", async (long id, AssignAppointmentEmployeeRequest r, IAppointmentService s, CancellationToken ct) =>
            Results.Ok(await s.AssignEmployeeAsync(id, r.EmployeeId!.Value, ct))).Validate<AssignAppointmentEmployeeRequest>();
        appointments.MapDelete("/{id:long}", async (long id, IAppointmentService s, CancellationToken ct) =>
        {
            await s.DeleteAsync(id, ct);
            return Results.NoContent();
        });

        // ---- Recepción ----
        var attentions = app.MapGroup("/api/attentions").WithTags("Attentions");

        attentions.MapGet("/", async (IAttentionService s, CancellationToken ct, int page = 0, int size = 10, AttentionType? type = null,
                AttentionsStatus? status = null, long? branchId = null, long? animalId = null, bool? emergency = null, long? appointmentId = null,
                long? clinicalServiceId = null, DateOnly? startDate = null, DateOnly? endDate = null) =>
            Results.Ok(await s.ListAsync(type, status, branchId, animalId, emergency, appointmentId, clinicalServiceId, startDate, endDate, page, size, ct)));
        attentions.MapGet("/{id:long}", async (long id, IAttentionService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        attentions.MapPost("/", async (CreateAttentionRequest r, IAttentionService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<CreateAttentionRequest>();
        attentions.MapPost("/from-appointment", async (CreateAttentionFromAppointmentRequest r, IAttentionService s, CancellationToken ct) =>
            Results.Ok(await s.CreateFromAppointmentAsync(r, ct))).Validate<CreateAttentionFromAppointmentRequest>();
        attentions.MapPatch("/{id:long}/status", async (long id, UpdateAttentionStatusRequest r, IAttentionService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateStatusAsync(id, r.Status!.Value, ct))).Validate<UpdateAttentionStatusRequest>();
        attentions.MapPatch("/{id:long}/attending-employee", async (long id, UpdateAttentionAttendingEmployeeRequest r, IAttentionService s,
            CancellationToken ct) => Results.Ok(await s.UpdateAttendingEmployeeAsync(id, r.AttendingEmployeeId!.Value, ct)))
            .Validate<UpdateAttentionAttendingEmployeeRequest>();
        attentions.MapDelete("/{id:long}", async (long id, IAttentionService s, CancellationToken ct) =>
        {
            await s.DeleteAsync(id, ct);
            return Results.NoContent();
        });

        // ---- Atención clínica ----
        var clinical = app.MapGroup("/api/clinical-attentions").WithTags("Clinical attentions");

        clinical.MapGet("/", async (IClinicalAttentionService s, CancellationToken ct, int page = 0, int size = 10,
                QueryList<ClinicalAttentionStatus>? statuses = null, long? branchId = null, long? animalId = null, long? attentionId = null,
                long? attendingEmployeeId = null, DateOnly? startDate = null, DateOnly? endDate = null) =>
            Results.Ok(await s.ListAsync(statuses, branchId, animalId, attentionId, attendingEmployeeId, startDate, endDate, page, size, ct)));
        clinical.MapGet("/{id:long}", async (long id, IClinicalAttentionService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        clinical.MapPost("/", async (CreateClinicalAttentionRequest r, IClinicalAttentionService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<CreateClinicalAttentionRequest>();
        clinical.MapGet("/by-attention/{attentionId:long}", async (long attentionId, IClinicalAttentionService s, CancellationToken ct) =>
            Results.Ok(await s.GetOrCreateByAttentionAsync(attentionId, ct)));
        clinical.MapPatch("/{id:long}", async (long id, UpdateClinicalAttentionRequest r, IClinicalAttentionService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(id, r, ct)));
        clinical.MapPost("/{id:long}/medication-administrations", async (long id, AddClinicalAttentionMedicationRequest r, IClinicalAttentionService s,
            CancellationToken ct) => Results.Ok(await s.RegisterMedicationAsync(id, r, ct))).Validate<AddClinicalAttentionMedicationRequest>();
        clinical.MapPost("/{id:long}/service-items", async (long id, AddClinicalAttentionServiceItemRequest r, IClinicalAttentionService s,
            CancellationToken ct) => Results.Ok(await s.AddServiceItemAsync(id, r, ct))).Validate<AddClinicalAttentionServiceItemRequest>();
        clinical.MapPost("/{id:long}/surgical-orders", async (long id, AddClinicalAttentionSurgicalOrderRequest r, IClinicalAttentionService s,
            CancellationToken ct) => Results.Ok(await s.AddSurgicalOrderAsync(id, r, ct))).Validate<AddClinicalAttentionSurgicalOrderRequest>();
        clinical.MapPost("/{id:long}/laboratory-requests", async (long id, AddClinicalAttentionLaboratoryRequest r, IClinicalAttentionService s,
            CancellationToken ct) => Results.Ok(await s.AddLaboratoryRequestAsync(id, r, ct))).Validate<AddClinicalAttentionLaboratoryRequest>();
        clinical.MapGet("/active/grouped", async (IClinicalAttentionService s, CancellationToken ct, long? attendingEmployeeId = null) =>
            Results.Ok(await s.ListActiveGroupedAsync(attendingEmployeeId, ct)));
    }
}
