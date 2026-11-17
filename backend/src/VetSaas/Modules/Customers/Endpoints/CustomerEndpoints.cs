using VetSaas.Modules.Customers.Application;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Validation;
using static VetSaas.Modules.Users.Domain.RoleName;

namespace VetSaas.Modules.Customers.Endpoints;

public static class CustomerEndpoints
{
    public static void MapCustomerEndpoints(this WebApplication app)
    {
        var customers = app.MapGroup("/api/customers").WithTags("Customers");

        customers.MapPost("/create", async (CustomerCreateRequest request, ICustomerService service, CancellationToken ct) =>
            Results.Ok(await service.CreateAsync(request, ct)))
            .Validate<CustomerCreateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_RECEPTIONIST);

        customers.MapGet("/get", async (long id, ICustomerService service, CancellationToken ct) =>
            Results.Ok(await service.GetAsync(id, ct)));

        customers.MapGet("/list", async (bool active, ICustomerService service, CancellationToken ct,
                int page = 0, int size = 10, string? query = null) =>
            Results.Ok(await service.ListAsync(page, size, active, query, ct)));

        customers.MapGet("/quick-search", async (string name, ICustomerService service, CancellationToken ct) =>
            Results.Ok(await service.QuickSearchAsync(name, ct)));

        customers.MapPut("/update", async (CustomerUpdateRequest request, ICustomerService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(request, ct)))
            .Validate<CustomerUpdateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_RECEPTIONIST);

        customers.MapDelete("/soft-delete", async (long id, ICustomerService service, CancellationToken ct) =>
        {
            await service.SetActiveAsync(id, false, ct);
            return Results.Ok(new MessageResponse("Cliente deshabilitado correctamente"));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_RECEPTIONIST);

        customers.MapDelete("/hard-delete", async (long id, ICustomerService service, CancellationToken ct) =>
        {
            await service.HardDeleteAsync(id, ct);
            return Results.Ok(new MessageResponse("Cliente eliminado permanentemente"));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER);

        customers.MapPut("/restore", async (long id, ICustomerService service, CancellationToken ct) =>
            Results.Ok(await service.RestoreAsync(id, ct)))
            .RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_RECEPTIONIST);

        app.MapGet("/api/document-types", async (ICustomerService service, CancellationToken ct) =>
            Results.Ok(await service.GetDocumentTypesAsync(ct))).WithTags("Customers");

        var animals = app.MapGroup("/api/animals").WithTags("Animals");

        animals.MapPost("/create", async (AnimalCreateRequest request, IAnimalService service, CancellationToken ct) =>
            Results.Ok(await service.CreateAsync(request, ct)))
            .Validate<AnimalCreateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_RECEPTIONIST, ROLE_VETERINARIAN);

        animals.MapGet("/get", async (long id, IAnimalService service, CancellationToken ct) =>
            Results.Ok(await service.GetAsync(id, ct)));

        animals.MapGet("/list", async (bool active, IAnimalService service, CancellationToken ct,
                int page = 0, int size = 10, string? query = null) =>
            Results.Ok(await service.ListAsync(page, size, active, query, ct)));

        animals.MapGet("/quick-search", async (IAnimalService service, CancellationToken ct,
                string? query = null, bool active = true) =>
            Results.Ok(await service.QuickSearchAsync(query, active, ct)));

        animals.MapPut("/update", async (AnimalUpdateRequest request, IAnimalService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(request, ct)))
            .Validate<AnimalUpdateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_RECEPTIONIST, ROLE_VETERINARIAN);

        animals.MapDelete("/soft-delete", async (long id, IAnimalService service, CancellationToken ct) =>
        {
            await service.SoftDeleteAsync(id, ct);
            return Results.Ok(new MessageResponse("Animal deshabilitado correctamente"));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_RECEPTIONIST, ROLE_VETERINARIAN);

        animals.MapDelete("/hard-delete", async (long id, IAnimalService service, CancellationToken ct) =>
        {
            await service.HardDeleteAsync(id, ct);
            return Results.Ok(new MessageResponse("Animal eliminado permanentemente"));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER);

        animals.MapPut("/restore", async (long id, IAnimalService service, CancellationToken ct) =>
            Results.Ok(await service.RestoreAsync(id, ct)))
            .RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_RECEPTIONIST, ROLE_VETERINARIAN);

        animals.MapGet("/clinical-history", async (long animalId, IAnimalService service, CancellationToken ct) =>
            Results.Ok(await service.GetClinicalHistoryGroupedAsync(animalId, ct)))
            .RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_RECEPTIONIST, ROLE_VETERINARIAN);
    }
}
