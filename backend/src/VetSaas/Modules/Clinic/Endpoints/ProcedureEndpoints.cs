using VetSaas.Modules.Clinic.Application;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Shared.Infrastructure.Http;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Validation;
using static VetSaas.Modules.Users.Domain.RoleName;

namespace VetSaas.Modules.Clinic.Endpoints;

public static class ProcedureEndpoints
{
    public static void MapClinicProcedureEndpoints(this WebApplication app)
    {
        // ---- Jaulas ----
        var cages = app.MapGroup("/api/cages").WithTags("Hospitalization");
        cages.MapGet("/", async (ICageService s, CancellationToken ct, long? branchId = null, string? name = null, CageSize? size = null,
                bool? isOccupied = null, int page = 0, int pageSize = 10) =>
            Results.Ok(await s.ListAsync(branchId, name, size, isOccupied, page, pageSize, ct)));
        cages.MapGet("/{id:long}", async (long id, ICageService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        cages.MapPost("/", async (CageRequest r, ICageService s, CancellationToken ct) =>
            Results.Json(await s.CreateAsync(r, ct), statusCode: StatusCodes.Status201Created)).Validate<CageRequest>();
        cages.MapPut("/{id:long}", async (long id, CageRequest r, ICageService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(id, r, ct))).Validate<CageRequest>();
        cages.MapDelete("/{id:long}", async (long id, ICageService s, CancellationToken ct) =>
        {
            await s.DeleteAsync(id, ct);
            return Results.NoContent();
        });

        // ---- Hospitalización ----
        var hosp = app.MapGroup("/api/hospitalizations").WithTags("Hospitalization");
        hosp.MapGet("/", async (IHospitalizationService s, CancellationToken ct, long? branchId = null, long? animalId = null, long? cageId = null,
                QueryList<HospitalizationStatus>? statuses = null, DateOnly? startDate = null, DateOnly? endDate = null, int page = 0, int pageSize = 10) =>
            Results.Ok(await s.ListAsync(branchId, animalId, cageId, statuses, startDate, endDate, page, pageSize, ct)));
        hosp.MapGet("/{id:long}", async (long id, IHospitalizationService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        hosp.MapPost("/", async (CreateHospitalizationRequest r, IHospitalizationService s, CancellationToken ct) =>
            Results.Json(await s.CreateAsync(r, ct), statusCode: StatusCodes.Status201Created)).Validate<CreateHospitalizationRequest>();
        hosp.MapPatch("/{id:long}", async (long id, UpdateHospitalizationRequest r, IHospitalizationService s, CancellationToken ct) =>
            Results.Ok(await s.PatchAsync(id, r, ct))).Validate<UpdateHospitalizationRequest>();
        hosp.MapPost("/{id:long}/evolution-notes", async (long id, AddEvolutionNoteRequest r, IHospitalizationService s, CancellationToken ct) =>
            Results.Ok(await s.AddEvolutionNoteAsync(id, r, ct))).Validate<AddEvolutionNoteRequest>();
        hosp.MapPost("/{id:long}/vitals", async (long id, CreateHospitalizationVitalSignRequest r, IHospitalizationService s, CancellationToken ct) =>
            Results.Ok(await s.AddVitalSignAsync(id, r, ct))).Validate<CreateHospitalizationVitalSignRequest>();
        hosp.MapPatch("/{hospitalizationId:long}/treatment-schedules/{scheduleId:long}", async (long hospitalizationId, long scheduleId,
                UpdateTreatmentScheduleRequest r, IHospitalizationService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateTreatmentScheduleAsync(hospitalizationId, scheduleId, r, ct))).Validate<UpdateTreatmentScheduleRequest>();
        hosp.MapPost("/{hospitalizationId:long}/treatment-schedules", async (long hospitalizationId, CreateTreatmentScheduleRequest r,
                IHospitalizationService s, CancellationToken ct) => Results.Ok(await s.AddTreatmentScheduleAsync(hospitalizationId, r, ct)))
            .Validate<CreateTreatmentScheduleRequest>();

        // ---- Órdenes quirúrgicas ----
        var orders = app.MapGroup("/api/surgical-orders").WithTags("Surgery");
        orders.MapGet("/", async (ISurgicalOrderService s, CancellationToken ct, int page = 0, int size = 10, SurgicalOrderStatus? status = null,
                long? animalId = null, long? branchId = null, long? recommendedServiceId = null) =>
            Results.Ok(await s.ListAsync(status, animalId, branchId, recommendedServiceId, page, size, ct)));
        orders.MapGet("/{id:long}", async (long id, ISurgicalOrderService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        orders.MapPost("/", async (CreateSurgicalOrderRequest r, ISurgicalOrderService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<CreateSurgicalOrderRequest>();
        orders.MapPut("/{id:long}", async (long id, UpdateSurgicalOrderRequest r, ISurgicalOrderService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(id, r, ct)));
        orders.MapDelete("/{id:long}", async (long id, ISurgicalOrderService s, CancellationToken ct) =>
        {
            await s.DeleteAsync(id, ct);
            return Results.NoContent();
        });
        orders.MapGet("/pending/by-animal/{animalId:long}", async (long animalId, ISurgicalOrderService s, CancellationToken ct) =>
            Results.Ok(await s.PendingByAnimalAsync(animalId, ct)));

        // ---- Reportes quirúrgicos ----
        var reports = app.MapGroup("/api/surgical-reports").WithTags("Surgery");
        reports.MapGet("/", async (ISurgicalReportService s, CancellationToken ct, int page = 0, int size = 10,
                QueryList<SurgicalReportStatus>? statuses = null, long? branchId = null, long? animalId = null, long? attentionId = null,
                long? surgeonId = null, long? operatingRoomId = null, DateOnly? startDate = null, DateOnly? endDate = null) =>
            Results.Ok(await s.ListAsync(statuses, branchId, animalId, attentionId, surgeonId, operatingRoomId, startDate, endDate, page, size, ct)));
        reports.MapGet("/{id:long}", async (long id, ISurgicalReportService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        reports.MapGet("/by-attention/{attentionId:long}", async (long attentionId, ISurgicalReportService s, CancellationToken ct) =>
            Results.Ok(await s.GetOrCreateByAttentionAsync(attentionId, ct)));
        reports.MapPost("/", async (CreateSurgicalReportRequest r, ISurgicalReportService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<CreateSurgicalReportRequest>();
        reports.MapPatch("/{id:long}", async (long id, UpdateSurgicalReportRequest r, ISurgicalReportService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(id, r, ct)));
        reports.MapPost("/{id:long}/anesthetic-drugs", async (long id, AddSurgicalReportAnestheticDrugRequest r, ISurgicalReportService s,
            CancellationToken ct) => Results.Ok(await s.AddAnestheticDrugAsync(id, r, ct))).Validate<AddSurgicalReportAnestheticDrugRequest>();
        reports.MapPost("/{id:long}/materials", async (long id, AddSurgicalReportMaterialRequest r, ISurgicalReportService s, CancellationToken ct) =>
            Results.Ok(await s.AddMaterialAsync(id, r, ct))).Validate<AddSurgicalReportMaterialRequest>();
        reports.MapPost("/{id:long}/post-operative-indications", async (long id, AddSurgicalReportPostOperativeIndicationRequest r,
                ISurgicalReportService s, CancellationToken ct) => Results.Ok(await s.AddPostOperativeIndicationAsync(id, r, ct)))
            .Validate<AddSurgicalReportPostOperativeIndicationRequest>();

        // ---- Solicitudes de laboratorio ----
        var labs = app.MapGroup("/api/laboratory-requests").WithTags("Laboratory");
        labs.MapGet("/", async (ILaboratoryRequestService s, CancellationToken ct, int page = 0, int size = 10,
                QueryList<LabRequestStatus>? statuses = null, long? branchId = null, long? animalId = null, long? laboratoryId = null,
                long? requestingEmployeeId = null, DateOnly? startDate = null, DateOnly? endDate = null) =>
            Results.Ok(await s.ListAsync(statuses, branchId, animalId, laboratoryId, requestingEmployeeId, startDate, endDate, page, size, ct)));
        labs.MapGet("/{id:long}", async (long id, ILaboratoryRequestService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        labs.MapPost("/", async (CreateLaboratoryRequest r, ILaboratoryRequestService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<CreateLaboratoryRequest>();
        labs.MapPost("/items/{requestItemId:long}/results", async (long requestItemId, AddResultValuesRequest r, ILaboratoryRequestService s,
            CancellationToken ct) => Results.Ok(await s.AddResultsAsync(requestItemId, r, ct))).Validate<AddResultValuesRequest>();
        labs.MapPatch("/{id:long}/status", async (long id, UpdateLabRequestStatusRequest r, ILaboratoryRequestService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateStatusAsync(id, r.Status!.Value, ct))).Validate<UpdateLabRequestStatusRequest>();

        // ---- Peluquería ----
        var grooming = app.MapGroup("/api/grooming-sessions").WithTags("Grooming");
        grooming.MapGet("/", async (IGroomingSessionService s, CancellationToken ct, int page = 0, int size = 10,
                QueryList<GroomingStatus>? statuses = null, long? branchId = null, long? animalId = null, long? attentionId = null,
                long? assignedProfessionalId = null, DateOnly? startDate = null, DateOnly? endDate = null) =>
            Results.Ok(await s.ListAsync(statuses, branchId, animalId, attentionId, assignedProfessionalId, startDate, endDate, page, size, ct)));
        grooming.MapGet("/{id:long}", async (long id, IGroomingSessionService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        grooming.MapGet("/by-attention/{attentionId:long}", async (long attentionId, IGroomingSessionService s, CancellationToken ct) =>
            Results.Ok(await s.GetOrCreateByAttentionAsync(attentionId, ct)));
        grooming.MapPost("/", async (CreateGroomingSessionRequest r, IGroomingSessionService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<CreateGroomingSessionRequest>();
        grooming.MapPatch("/{id:long}", async (long id, UpdateGroomingSessionRequest r, IGroomingSessionService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(id, r, ct)));
        grooming.MapPost("/{id:long}/materials", async (long id, AddGroomingMaterialRequest r, IGroomingSessionService s, CancellationToken ct) =>
            Results.Ok(await s.AddMaterialAsync(id, r, ct))).Validate<AddGroomingMaterialRequest>();

        // ---- Historia clínica, registros y recordatorios ----
        app.MapGet("/api/history/summary", async (long animalId, IMedicalRecordService s, CancellationToken ct) =>
            Results.Ok(await s.Last20Async(animalId, ct))).WithTags("History");

        var history = app.MapGroup("/api/history/clinical").WithTags("History")
            .RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_VETERINARIAN, ROLE_ASSISTANT);
        history.MapGet("/animals", async (IClinicalHistoryService s, CancellationToken ct, int page = 0, int size = 10, string? query = null,
                QueryList<AnimalSpecies>? species = null, bool? active = null) =>
            Results.Ok(await s.SearchAnimalsAsync(query, species, active, page, size, ct)));
        history.MapGet("/animal", async (long animalId, IClinicalHistoryService s, CancellationToken ct, DateOnly? from = null, DateOnly? to = null) =>
            Results.Ok(await s.GetAnimalHistoryAsync(animalId, from, to, ct)));

        var reminders = app.MapGroup("/api/reminders").WithTags("Reminders")
            .RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_VETERINARIAN, ROLE_ASSISTANT, ROLE_RECEPTIONIST);
        reminders.MapGet("/", async (IReminderService s, CancellationToken ct, int page = 0, int size = 10, string? query = null,
                QueryList<ReminderType>? types = null, QueryList<ReminderStatus>? statuses = null, DateOnly? dueFrom = null, DateOnly? dueTo = null,
                bool includeManual = true, bool includeAutomatic = true) =>
            Results.Ok(await s.ListAsync(new ReminderQueryFilters(query, types, statuses, dueFrom, dueTo, includeManual, includeAutomatic), page, size, ct)));
        reminders.MapPost("/", async (ReminderCreateRequest r, IReminderService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<ReminderCreateRequest>();
        reminders.MapDelete("/{id:long}", async (long id, IReminderService s, CancellationToken ct) =>
        {
            await s.DeleteAsync(id, ct);
            return Results.NoContent();
        });
        reminders.MapPatch("/{id:long}/status", async (long id, ReminderUpdateStatusRequest r, IReminderService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateStatusAsync(id, r.Status!.Value, ct))).Validate<ReminderUpdateStatusRequest>();
    }
}
