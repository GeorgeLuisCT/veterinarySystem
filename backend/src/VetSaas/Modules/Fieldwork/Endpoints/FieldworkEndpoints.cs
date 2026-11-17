using VetSaas.Modules.Fieldwork.Application;
using VetSaas.Modules.Fieldwork.Domain;
using VetSaas.Shared.Infrastructure.Validation;

namespace VetSaas.Modules.Fieldwork.Endpoints;

/// <summary>Trabajo de campo. Acceso por AccessRules (/api/fieldwork/**, /api/farms/**, /api/geo-zones/**: ADMIN, MANAGER, VETERINARIAN).</summary>
public static class FieldworkEndpoints
{
    public static void MapFieldworkEndpoints(this WebApplication app)
    {
        // ---- Zonas ----
        var zones = app.MapGroup("/api/geo-zones").WithTags("Fieldwork");
        zones.MapGet("/", async (IGeoZoneService s, CancellationToken ct, int page = 0, int size = 10, string? q = null, GeoZoneType? type = null,
            long? parentId = null, bool? active = null) => Results.Ok(await s.ListAsync(page, size, q, type, parentId, active, ct)));
        zones.MapGet("/detail", async (long id, IGeoZoneService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        zones.MapPost("/", async (CreateGeoZoneRequest r, IGeoZoneService s, CancellationToken ct) => Results.Ok(await s.CreateAsync(r, ct)))
            .Validate<CreateGeoZoneRequest>();
        zones.MapPut("/", async (long id, UpdateGeoZoneRequest r, IGeoZoneService s, CancellationToken ct) => Results.Ok(await s.UpdateAsync(id, r, ct)))
            .Validate<UpdateGeoZoneRequest>();
        zones.MapDelete("/", async (long id, IGeoZoneService s, CancellationToken ct) => Results.Ok(await s.DeleteAsync(id, ct)));

        // ---- Fincas ----
        var farms = app.MapGroup("/api/farms").WithTags("Fieldwork");
        farms.MapGet("/", async (IFarmService s, CancellationToken ct, int page = 0, int size = 10, string? q = null, long? customerId = null,
            long? zoneId = null) => Results.Ok(await s.ListAsync(page, size, q, customerId, zoneId, ct)));
        farms.MapGet("/detail", async (long id, IFarmService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        farms.MapGet("/quick-search", async (IFarmService s, CancellationToken ct, string? q = null, long? zoneId = null) =>
            Results.Ok(await s.QuickSearchAsync(q, zoneId, ct)));
        farms.MapPost("/", async (CreateFarmRequest r, IFarmService s, CancellationToken ct) => Results.Ok(await s.CreateAsync(r, ct)))
            .Validate<CreateFarmRequest>();
        farms.MapPut("/", async (long id, UpdateFarmRequest r, IFarmService s, CancellationToken ct) => Results.Ok(await s.UpdateAsync(id, r, ct)))
            .Validate<UpdateFarmRequest>();
        farms.MapDelete("/", async (long id, IFarmService s, CancellationToken ct) => Results.Ok(await s.DeleteAsync(id, ct)));

        // ---- Vehículos ----
        var vehicles = app.MapGroup("/api/fieldwork/vehicles").WithTags("Fieldwork");
        vehicles.MapGet("/", async (IVehicleService s, CancellationToken ct) => Results.Ok(await s.ListAsync(ct)));
        vehicles.MapGet("/detail", async (long id, IVehicleService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        vehicles.MapGet("/quick-search", async (IVehicleService s, CancellationToken ct, string? q = null, bool? onlyActive = null) =>
            Results.Ok(await s.QuickSearchAsync(q, onlyActive, ct)));
        vehicles.MapPost("/", async (CreateVehicleRequest r, IVehicleService s, CancellationToken ct) => Results.Ok(await s.CreateAsync(r, ct)))
            .Validate<CreateVehicleRequest>();
        vehicles.MapPut("/", async (long id, UpdateVehicleRequest r, IVehicleService s, CancellationToken ct) => Results.Ok(await s.UpdateAsync(id, r, ct)))
            .Validate<UpdateVehicleRequest>();
        vehicles.MapDelete("/", async (long id, IVehicleService s, CancellationToken ct) => Results.Ok(await s.DeleteAsync(id, ct)));
        vehicles.MapGet("/stock", async (long vehicleId, IVehicleService s, CancellationToken ct, int page = 0, int size = 10) =>
            Results.Ok(await s.StockAsync(vehicleId, page, size, ct)));
        vehicles.MapPost("/stock/adjust", async (AdjustVehicleStockRequest r, IVehicleService s, CancellationToken ct, long? employeeId = null) =>
            Results.Ok(await s.AdjustStockAsync(r, employeeId, ct))).Validate<AdjustVehicleStockRequest>();
        vehicles.MapGet("/movements", async (IVehicleService s, CancellationToken ct, long? vehicleId = null, int page = 0, int size = 10) =>
            Results.Ok(await s.MovementsAsync(vehicleId, page, size, ct)));
        vehicles.MapPost("/pings", async (CreateVehiclePingRequest r, IVehicleService s, CancellationToken ct) => Results.Ok(await s.CreatePingAsync(r, ct)))
            .Validate<CreateVehiclePingRequest>();
        vehicles.MapGet("/pings", async (long vehicleId, DateTime from, DateTime to, IVehicleService s, CancellationToken ct, int page = 0, int size = 10) =>
            Results.Ok(await s.PingsAsync(vehicleId, from, to, page, size, ct)));

        // ---- Visitas ----
        var visits = app.MapGroup("/api/fieldwork/visits").WithTags("Fieldwork");
        visits.MapGet("/", async (IFieldVisitService s, CancellationToken ct, int page = 0, int size = 10, string? q = null, FieldVisitStatus? status = null,
                long? vetId = null, long? farmId = null, long? zoneId = null, long? vehicleId = null, DateTime? from = null, DateTime? to = null) =>
            Results.Ok(await s.ListAsync(page, size, q, status, vetId, farmId, zoneId, vehicleId, from, to, ct)));
        visits.MapGet("/detail", async (long id, IFieldVisitService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        visits.MapPost("/", async (CreateFieldVisitRequest r, IFieldVisitService s, CancellationToken ct) => Results.Ok(await s.CreateAsync(r, ct)))
            .Validate<CreateFieldVisitRequest>();
        visits.MapPut("/", async (long id, UpdateFieldVisitRequest r, IFieldVisitService s, CancellationToken ct) => Results.Ok(await s.UpdateAsync(id, r, ct)))
            .Validate<UpdateFieldVisitRequest>();
        visits.MapDelete("/", async (long id, IFieldVisitService s, CancellationToken ct) => Results.Ok(await s.DeleteAsync(id, ct)));
        visits.MapPost("/service-item", async (long visitId, AddServiceItemRequest r, IFieldVisitService s, CancellationToken ct) =>
            Results.Ok(await s.AddServiceItemAsync(visitId, r, ct))).Validate<AddServiceItemRequest>();
        visits.MapPatch("/report", async (long visitId, UpdateFieldVisitReportRequest r, IFieldVisitService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateReportAsync(visitId, r, ct))).Validate<UpdateFieldVisitReportRequest>();
        visits.MapPost("/product-usage", async (long visitId, AddProductUsageRequest r, IFieldVisitService s, CancellationToken ct, long? performedById = null) =>
            Results.Ok(await s.AddProductUsageAsync(visitId, r, performedById, ct))).Validate<AddProductUsageRequest>();
        visits.MapPost("/attachment", async (long visitId, AddAttachmentRequest r, IFieldVisitService s, CancellationToken ct) =>
            Results.Ok(await s.AddAttachmentAsync(visitId, r, ct))).Validate<AddAttachmentRequest>();
        visits.MapPut("/biosecurity", async (long visitId, SetBiosecurityRequest r, IFieldVisitService s, CancellationToken ct) =>
            Results.Ok(await s.SetBiosecurityAsync(visitId, r, ct)));
        visits.MapPatch("/status", async (long visitId, UpdateFieldVisitStatusRequest r, IFieldVisitService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateStatusAsync(visitId, r.Status!.Value, ct))).Validate<UpdateFieldVisitStatusRequest>();

        // ---- Tareas ----
        var tasks = app.MapGroup("/api/fieldwork/tasks").WithTags("Fieldwork");
        tasks.MapGet("/", async (IFieldTaskService s, CancellationToken ct, int page = 0, int size = 10, string? q = null, FieldTaskStatus? status = null,
                FieldTaskPriority? priority = null, long? assignedToId = null, long? farmId = null, long? zoneId = null, DateTime? dueFrom = null,
                DateTime? dueTo = null) =>
            Results.Ok(await s.ListAsync(page, size, q, status, priority, assignedToId, farmId, zoneId, dueFrom, dueTo, ct)));
        tasks.MapGet("/detail", async (long id, IFieldTaskService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        tasks.MapPost("/", async (CreateFieldTaskRequest r, IFieldTaskService s, CancellationToken ct, long? createdById = null) =>
            Results.Ok(await s.CreateAsync(r, createdById, ct))).Validate<CreateFieldTaskRequest>();
        tasks.MapPut("/", async (long id, UpdateFieldTaskRequest r, IFieldTaskService s, CancellationToken ct) => Results.Ok(await s.UpdateAsync(id, r, ct)))
            .Validate<UpdateFieldTaskRequest>();
        tasks.MapDelete("/", async (long id, IFieldTaskService s, CancellationToken ct) => Results.Ok(await s.DeleteAsync(id, ct)));
        tasks.MapPost("/assign", async (long taskId, AssignFieldTaskRequest r, IFieldTaskService s, CancellationToken ct, long? assignedById = null) =>
            Results.Ok(await s.AssignAsync(taskId, r, assignedById, ct))).Validate<AssignFieldTaskRequest>();

        // ---- Rutas y estado del equipo ----
        var routes = app.MapGroup("/api/fieldwork/route-days").WithTags("Fieldwork");
        routes.MapGet("/", async (DateOnly date, IFieldRouteService s, CancellationToken ct) => Results.Ok(await s.ListByDateAsync(date, ct)));
        routes.MapPost("/", async (CreateFieldRouteDayRequest r, IFieldRouteService s, CancellationToken ct) => Results.Ok(await s.CreateAsync(r, ct)))
            .Validate<CreateFieldRouteDayRequest>();

        var team = app.MapGroup("/api/fieldwork/team-status").WithTags("Fieldwork");
        team.MapGet("/", async (ITeamStatusService s, CancellationToken ct) => Results.Ok(await s.ListAsync(ct)));
        team.MapPut("/", async (SetTeamStatusRequest r, ITeamStatusService s, CancellationToken ct) => Results.Ok(await s.SetAsync(r, ct)))
            .Validate<SetTeamStatusRequest>();
    }
}
