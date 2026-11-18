using FluentValidation;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Modules.Fieldwork.Domain;
using VetSaas.Modules.Inventory.Application;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Infrastructure.Json;

namespace VetSaas.Modules.Fieldwork.Application;

// ---- Zonas ----
public record CreateGeoZoneRequest
{
    public string? Name { get; init; }
    public string? Type { get; init; }
    public long? ParentId { get; init; }
    public string? GpsCoordinates { get; init; }
    public bool? Active { get; init; }
}
public sealed record UpdateGeoZoneRequest : CreateGeoZoneRequest;

public class GeoZoneValidator<T> : AbstractValidator<T> where T : CreateGeoZoneRequest
{
    public GeoZoneValidator()
    {
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no debe estar vacío");
        RuleFor(r => r.Type).NotNull().WithMessage("El tipo de zona es obligatorio");
    }
}
public sealed class CreateGeoZoneValidator : GeoZoneValidator<CreateGeoZoneRequest>;
public sealed class UpdateGeoZoneValidator : GeoZoneValidator<UpdateGeoZoneRequest>;

public sealed record GeoZoneSummaryResponse(long Id, string Name, string Type, long? ParentId, string? ParentName, bool Active);
public sealed record GeoZoneResponse(long Id, string Name, string Type, long? ParentId, string? ParentName, string? GpsCoordinates, bool Active);

// ---- Fincas ----
public record CreateFarmRequest
{
    public long? CustomerId { get; init; }
    public string? Name { get; init; }
    public long? ZoneId { get; init; }
    public string? LocationDescription { get; init; }
    public string? GpsCoordinates { get; init; }
    public string? AddressLabel { get; init; }
}
public sealed record UpdateFarmRequest : CreateFarmRequest;

public class FarmValidator<T> : AbstractValidator<T> where T : CreateFarmRequest
{
    public FarmValidator()
    {
        RuleFor(r => r.CustomerId).NotNull().WithMessage("El cliente es obligatorio");
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no debe estar vacío");
    }
}
public sealed class CreateFarmValidator : FarmValidator<CreateFarmRequest>;
public sealed class UpdateFarmValidator : FarmValidator<UpdateFarmRequest>;

public sealed record FarmSummaryResponse(long Id, string Name, long CustomerId, string? CustomerName, long? ZoneId, string? ZoneName);
public sealed record FarmResponse(long Id, string Name, long CustomerId, string? CustomerName, long? ZoneId, string? ZoneName,
    string? LocationDescription, string? GpsCoordinates, string? AddressLabel);
public sealed record FarmQuickSearchResponse(long Id, string Name, string? CustomerName, long? ZoneId, string? ZoneName);

// ---- Vehículos ----
public record CreateVehicleRequest
{
    public string? Name { get; init; }
    public string? LicensePlate { get; init; }
    public long? AssignedVetEmployeeId { get; init; }
    public long? HomeBranchId { get; init; }
    public bool? Active { get; init; }
}
public sealed record UpdateVehicleRequest : CreateVehicleRequest;

public class VehicleValidator<T> : AbstractValidator<T> where T : CreateVehicleRequest
{
    public VehicleValidator() => RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no debe estar vacío");
}
public sealed class CreateVehicleValidator : VehicleValidator<CreateVehicleRequest>;
public sealed class UpdateVehicleValidator : VehicleValidator<UpdateVehicleRequest>;

public sealed record AdjustVehicleStockRequest(long? VehicleId, long? ProductId, int? QuantityDelta, ProductUnitType? Unit, string? Notes);

public sealed class AdjustVehicleStockValidator : AbstractValidator<AdjustVehicleStockRequest>
{
    public AdjustVehicleStockValidator()
    {
        RuleFor(r => r.VehicleId).NotNull().WithMessage("El vehículo es obligatorio");
        RuleFor(r => r.ProductId).NotNull().WithMessage("El producto es obligatorio");
        RuleFor(r => r.QuantityDelta).NotNull().WithMessage("La cantidad es obligatoria");
    }
}

public sealed record CreateVehiclePingRequest(long? VehicleId, long? EmployeeId, DateTime? Timestamp, double? Latitude, double? Longitude,
    double? SpeedKmh, string? Note);

public sealed class CreateVehiclePingValidator : AbstractValidator<CreateVehiclePingRequest>
{
    public CreateVehiclePingValidator()
    {
        RuleFor(r => r.VehicleId).NotNull().WithMessage("El vehículo es obligatorio");
        RuleFor(r => r.Timestamp).NotNull().WithMessage("La hora es obligatoria");
        RuleFor(r => r.Latitude).NotNull().WithMessage("La latitud es obligatoria");
        RuleFor(r => r.Longitude).NotNull().WithMessage("La longitud es obligatoria");
    }
}

public sealed record VehicleResponse(long Id, string Name, string? LicensePlate, long? AssignedVetEmployeeId, string? AssignedVetName,
    long? HomeBranchId, string? HomeBranchName, bool Active);
public sealed record VehicleQuickSearchResponse(long Id, string Name, string? LicensePlate, bool Active);
public sealed record VehicleStockResponse(long Id, long VehicleId, long ProductId, string ProductName, string Sku, ProductUnitType Unit, int Quantity);
public sealed record ProductStockMovementResponse(long Id, StockMovementType MovementType, long ProductId, string? ProductName, ProductUnitType? Unit,
    int QuantityDelta, StockLocationType FromType, StockLocationType ToType, long? VehicleId, long? BranchId, long? FieldVisitId, long? CreatedById,
    DateTime CreatedAt, string? Notes);
public sealed record VehiclePingResponse(long Id, long VehicleId, DateTime Timestamp, double Latitude, double Longitude, double? SpeedKmh, string? Note);

// ---- Visitas ----
public record CreateFieldVisitRequest
{
    public long? FarmId { get; init; }
    public long? ZoneId { get; init; }
    public long? FieldVetId { get; init; }
    public long? VehicleId { get; init; }
    public DateTime? ScheduledDateTime { get; init; }
    public string? Objective { get; init; }
    public List<long?>? CompanionIds { get; init; }
}

public sealed record UpdateFieldVisitRequest : CreateFieldVisitRequest
{
    public FieldVisitStatus? Status { get; init; }
    public int? RouteOrder { get; init; }
}

public class FieldVisitValidator<T> : AbstractValidator<T> where T : CreateFieldVisitRequest
{
    public FieldVisitValidator()
    {
        RuleFor(r => r.FieldVetId).NotNull().WithMessage("El veterinario de campo es obligatorio");
        RuleFor(r => r.ScheduledDateTime).NotNull().WithMessage("La fecha programada es obligatoria");
    }
}
public sealed class CreateFieldVisitValidator : FieldVisitValidator<CreateFieldVisitRequest>;
public sealed class UpdateFieldVisitValidator : FieldVisitValidator<UpdateFieldVisitRequest>
{
    public UpdateFieldVisitValidator() => RuleFor(r => r.Status).NotNull().WithMessage("El estado de la visita es obligatorio");
}

public sealed record UpdateFieldVisitStatusRequest(FieldVisitStatus? Status);
public sealed class UpdateFieldVisitStatusValidator : AbstractValidator<UpdateFieldVisitStatusRequest>
{
    public UpdateFieldVisitStatusValidator() => RuleFor(r => r.Status).NotNull().WithMessage("El estado de la visita es obligatorio");
}

public sealed record UpdateFieldVisitReportRequest(uint? Version, Optional<string?> Findings, Optional<string?> Diagnoses, Optional<string?> Recommendations);
public sealed class UpdateFieldVisitReportValidator : AbstractValidator<UpdateFieldVisitReportRequest>
{
    public UpdateFieldVisitReportValidator() => RuleFor(r => r.Version).NotNull().WithMessage("La versión es obligatoria");
}

public sealed record FieldVisitServiceGroupInput(string? Species, string? Breed, int? Quantity, string? Description);
public sealed record FieldVisitServiceProductInput(long? ProductId, decimal? Dose, ProductUnitType? Unit, string? AdministrationRoute);

public sealed record AddServiceItemRequest(long? ClinicalServiceId, int? Quantity, decimal? UnitPrice, long? PerformedById, string? Notes,
    List<long>? AnimalIds, List<FieldVisitServiceGroupInput>? Groups, List<FieldVisitServiceProductInput>? Products);

public sealed class AddServiceItemValidator : AbstractValidator<AddServiceItemRequest>
{
    public AddServiceItemValidator()
    {
        RuleFor(r => r.ClinicalServiceId).NotNull().WithMessage("El servicio es obligatorio");
        RuleFor(r => r.Quantity).NotNull().WithMessage("La cantidad es obligatoria").GreaterThanOrEqualTo(1).WithMessage("La cantidad debe ser al menos 1");
        RuleFor(r => r.UnitPrice).NotNull().WithMessage("El precio es obligatorio").GreaterThanOrEqualTo(0).WithMessage("El precio no puede ser negativo");
        RuleForEach(r => r.Groups).ChildRules(g =>
        {
            g.RuleFor(x => x.Species).NotNull().WithMessage("La especie es obligatoria");
            g.RuleFor(x => x.Breed).MaximumLength(255).WithMessage("La raza no debe superar 255 caracteres");
            g.RuleFor(x => x.Quantity).NotNull().WithMessage("La cantidad es obligatoria").GreaterThanOrEqualTo(1).WithMessage("La cantidad debe ser al menos 1");
            g.RuleFor(x => x.Description).MaximumLength(1000).WithMessage("La descripción no debe superar 1000 caracteres");
        });
        RuleForEach(r => r.Products).ChildRules(p =>
        {
            p.RuleFor(x => x.ProductId).NotNull().WithMessage("El producto es obligatorio");
            p.RuleFor(x => x.Dose).GreaterThan(0).When(x => x.Dose is not null).WithMessage("La dosis debe ser mayor a 0");
            p.RuleFor(x => x.Unit).NotNull().WithMessage("La unidad es obligatoria");
            p.RuleFor(x => x.AdministrationRoute).NotNull().WithMessage("La vía de administración es obligatoria");
        });
    }
}

public sealed record AddProductUsageRequest(long? ProductId, ProductUnitType? Unit, int? QuantityUsed, decimal? UnitPrice, long? VehicleId, string? Notes);

public sealed class AddProductUsageValidator : AbstractValidator<AddProductUsageRequest>
{
    public AddProductUsageValidator()
    {
        RuleFor(r => r.ProductId).NotNull().WithMessage("El producto es obligatorio");
        RuleFor(r => r.Unit).NotNull().WithMessage("La unidad es obligatoria");
        RuleFor(r => r.QuantityUsed).NotNull().WithMessage("La cantidad es obligatoria").GreaterThanOrEqualTo(1).WithMessage("La cantidad debe ser al menos 1");
        RuleFor(r => r.UnitPrice).GreaterThan(0).When(r => r.UnitPrice is not null).WithMessage("El precio debe ser mayor a 0");
    }
}

public sealed record AddAttachmentRequest(string? FileName, string? FileUrl, string? MimeType);
public sealed class AddAttachmentValidator : AbstractValidator<AddAttachmentRequest>
{
    public AddAttachmentValidator()
    {
        RuleFor(r => r.FileName).NotEmpty().WithMessage("El nombre del archivo es obligatorio");
        RuleFor(r => r.FileUrl).NotEmpty().WithMessage("La URL del archivo es obligatoria");
    }
}

public sealed record SetBiosecurityRequest(bool? VehicleAndEquipmentCleaned, bool? PpeUsed, bool? HandHygiene, string? Notes);

public sealed record FieldVisitCompanionResponse(long EmployeeId, string EmployeeName);
public sealed record FieldVisitServiceAnimalResponse(long Id, long AnimalId, string? AnimalName, string? Species, string? Breed);
public sealed record FieldVisitServiceGroupResponse(long Id, string? Species, string? Breed, int? Quantity, string? Description);
public sealed record FieldVisitServiceProductResponse(long Id, ProductBasicResponse? Product, decimal? Dose, ProductUnitType Unit, string AdministrationRoute);
public sealed record FieldVisitServiceItemResponse(long Id, long ClinicalServiceId, string ClinicalServiceName, int Quantity, decimal UnitPrice,
    long? PerformedById, string? PerformedByName, string? Notes, IReadOnlyList<FieldVisitServiceAnimalResponse> Animals,
    IReadOnlyList<FieldVisitServiceGroupResponse> Groups, IReadOnlyList<FieldVisitServiceProductResponse> Products);
public sealed record FieldVisitProductUsageResponse(long Id, long ProductId, string? ProductName, ProductUnitType Unit, int QuantityUsed, decimal? UnitPrice,
    decimal? Subtotal, long? VehicleId, string? VehicleName, string? Notes);
public sealed record FieldVisitAttachmentResponse(long Id, string FileName, string FileUrl, string? MimeType);
public sealed record FieldVisitBiosecurityResponse(bool VehicleAndEquipmentCleaned, bool PpeUsed, bool HandHygiene, string? Notes);
public sealed record FieldVisitReportResponse(long Id, uint Version, string? Findings, string? Diagnoses, string? Recommendations, DateTime? UpdatedAt);

public sealed record FieldVisitSummaryResponse(long Id, long? FarmId, string? FarmName, long? ZoneId, string? ZoneName, DateTime ScheduledDateTime,
    FieldVisitStatus Status, long FieldVetId, string? FieldVetName, long? VehicleId, string? VehicleName, string? Objective,
    IReadOnlyList<FieldVisitCompanionResponse> Companions);

public sealed record FieldVisitResponse(long Id, long? FarmId, string? FarmName, long? ZoneId, string? ZoneName, DateTime ScheduledDateTime,
    FieldVisitStatus Status, long FieldVetId, string? FieldVetName, long? VehicleId, string? VehicleName, string? Objective,
    IReadOnlyList<FieldVisitCompanionResponse> Companions, IReadOnlyList<FieldVisitServiceItemResponse> ServiceItems,
    IReadOnlyList<FieldVisitProductUsageResponse> ProductUsages, FieldVisitBiosecurityResponse? Biosecurity,
    IReadOnlyList<FieldVisitAttachmentResponse> Attachments, FieldVisitReportResponse? Report);

// ---- Tareas, rutas y estado del equipo ----
public sealed record CreateFieldTaskRequest(string? Title, long? ZoneId, List<long>? FarmIds, string? Description, string? Priority,
    FieldTaskStatus? Status, DateTime? DueAt);

public sealed class CreateFieldTaskValidator : AbstractValidator<CreateFieldTaskRequest>
{
    public CreateFieldTaskValidator()
    {
        RuleFor(r => r.Title).NotEmpty().WithMessage("El título es obligatorio");
        RuleFor(r => r.FarmIds).NotEmpty().WithMessage("Debe seleccionar al menos una finca para la planificación.");
        RuleFor(r => r.Priority).NotNull().WithMessage("La prioridad es obligatoria");
    }
}

public sealed record UpdateFieldTaskRequest(string? Title, long? ZoneId, long? FarmId, string? Description, string? Priority,
    FieldTaskStatus? Status, DateTime? DueAt);

public sealed class UpdateFieldTaskValidator : AbstractValidator<UpdateFieldTaskRequest>
{
    public UpdateFieldTaskValidator()
    {
        RuleFor(r => r.Title).NotEmpty().WithMessage("El título es obligatorio");
        RuleFor(r => r.FarmId).NotNull().WithMessage("La finca es obligatoria");
        RuleFor(r => r.Priority).NotNull().WithMessage("La prioridad es obligatoria");
        RuleFor(r => r.Status).NotNull().WithMessage("El estado es obligatorio");
    }
}

public sealed record AssignFieldTaskRequest(long? FieldVetId, long? VehicleId, List<long?>? CompanionIds, DateTime? ScheduledDateTime, string? Objective);

public sealed class AssignFieldTaskValidator : AbstractValidator<AssignFieldTaskRequest>
{
    public AssignFieldTaskValidator()
    {
        RuleFor(r => r.FieldVetId).NotNull().WithMessage("El veterinario de campo es obligatorio");
        RuleFor(r => r.ScheduledDateTime).NotNull().WithMessage("La fecha programada es obligatoria");
    }
}

public record FieldTaskSummaryResponse(long Id, string Title, long FarmId, string? FarmName, long? ZoneId, string? ZoneName, string Priority,
    FieldTaskStatus Status, long? AssignedToId, string? AssignedToName, DateTime? DueAt, long? CreatedFieldVisitId,
    FieldVisitStatus? CreatedFieldVisitStatus, long? VehicleId, string? VehicleName);

public sealed record FieldTaskResponse(long Id, string Title, long FarmId, string? FarmName, long? ZoneId, string? ZoneName, string Priority,
    FieldTaskStatus Status, long? AssignedToId, string? AssignedToName, DateTime? DueAt, long? CreatedFieldVisitId,
    FieldVisitStatus? CreatedFieldVisitStatus, long? VehicleId, string? VehicleName, string? Description);

public sealed record CreateFieldRouteStopRequest(long? FieldVisitId, int? Position, TimeOnly? Eta);
public sealed record CreateFieldRouteDayRequest(long? EmployeeId, long? VehicleId, DateOnly? RouteDate, List<CreateFieldRouteStopRequest>? Stops);

public sealed class CreateFieldRouteDayValidator : AbstractValidator<CreateFieldRouteDayRequest>
{
    public CreateFieldRouteDayValidator()
    {
        RuleFor(r => r.EmployeeId).NotNull().WithMessage("El empleado es obligatorio");
        RuleFor(r => r.RouteDate).NotNull().WithMessage("La fecha de la ruta es obligatoria");
        RuleForEach(r => r.Stops).ChildRules(s =>
        {
            s.RuleFor(x => x.FieldVisitId).NotNull().WithMessage("La visita es obligatoria");
            s.RuleFor(x => x.Position).NotNull().WithMessage("La posición es obligatoria");
        });
    }
}

public sealed record FieldRouteStopResponse(long Id, int Position, long FieldVisitId, string? FarmName, TimeOnly? Eta);
public sealed record FieldRouteDayResponse(long Id, DateOnly RouteDate, long EmployeeId, string? EmployeeName, long? VehicleId, string? VehicleName,
    IReadOnlyList<FieldRouteStopResponse> Stops);

public sealed record SetTeamStatusRequest(long? EmployeeId, FieldTeamStatus? Status, long? CurrentVisitId, string? LocationText, string? GpsCoordinates);

public sealed class SetTeamStatusValidator : AbstractValidator<SetTeamStatusRequest>
{
    public SetTeamStatusValidator()
    {
        RuleFor(r => r.EmployeeId).NotNull().WithMessage("El empleado es obligatorio");
        RuleFor(r => r.Status).NotNull().WithMessage("El estado es obligatorio");
    }
}

public sealed record TeamStatusResponse(long EmployeeId, string? EmployeeName, FieldTeamStatus Status, long? CurrentVisitId, long? CurrentVisitFarmId,
    string? CurrentVisitFarmName, long? CurrentVisitZoneId, string? CurrentVisitZoneName, string? LocationText, string? GpsCoordinates);
