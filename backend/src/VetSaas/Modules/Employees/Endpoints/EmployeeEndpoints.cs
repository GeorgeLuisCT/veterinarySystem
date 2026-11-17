using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Employees.Application;
using VetSaas.Modules.Users.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Validation;
using static VetSaas.Modules.Users.Domain.RoleName;

namespace VetSaas.Modules.Employees.Endpoints;

public static class EmployeeEndpoints
{
    public static void MapEmployeeEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/employees").WithTags("Employees");

        group.MapPost("/create", async (EmployeeCreateRequest request, IEmployeeService service, CancellationToken ct) =>
            Results.Ok(await service.CreateAsync(request, ct)))
            .Validate<EmployeeCreateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER);

        group.MapGet("/get", async (long id, IEmployeeService service, CancellationToken ct) =>
            Results.Ok(await service.GetAsync(id, ct)));

        group.MapGet("/", async (IEmployeeService service, CancellationToken ct,
                int page = 0, int size = 10, string? q = null, long? branchId = null, bool? active = null) =>
            Results.Ok(await service.ListAsync(page, size, q, branchId, active, ct)));

        group.MapGet("/quick-search", async (string name, IEmployeeService service, CancellationToken ct, long? branchId = null) =>
            Results.Ok(await service.QuickSearchAsync(name, branchId, ct)));

        group.MapPut("/update", async (EmployeeUpdateRequest request, IEmployeeService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(request, ct)))
            .Validate<EmployeeUpdateRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER);

        group.MapDelete("/soft-delete", async (long id, IEmployeeService service, CancellationToken ct, long? branchId = null) =>
        {
            await service.SoftDeleteAsync(id, branchId, ct);
            return Results.Ok(new MessageResponse("Empleado desactivado correctamente"));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER);

        group.MapDelete("/hard-delete", async (long id, IEmployeeService service, CancellationToken ct) =>
        {
            await service.HardDeleteAsync(id, ct);
            return Results.Ok(new MessageResponse("Empleado eliminado permanentemente"));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER);

        group.MapPut("/restore", async (long id, IEmployeeService service, CancellationToken ct, long? branchId = null) =>
            Results.Ok(await service.RestoreAsync(id, branchId, ct)))
            .RequireRoles(ROLE_ADMIN, ROLE_MANAGER);

        group.MapGet("/by-roles", async (RoleName[] roles, ICurrentUser current, IEmployeeService service, CancellationToken ct) =>
        {
            if (current.BranchId is not long branchId) return Results.BadRequest();
            return Results.Ok(await service.GetByUserRolesAndBranchAsync(roles, branchId, ct));
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER, ROLE_SUPERVISOR, ROLE_VETERINARIAN, ROLE_ASSISTANT, ROLE_CASHIER,
            ROLE_RECEPTIONIST, ROLE_GROOMER);

        var branches = app.MapGroup("/api/branches").WithTags("Branches");

        branches.MapGet("/", async (IBranchService service, CancellationToken ct, string? search = null) =>
            Results.Ok(await service.GetAllAsync(search, ct)));

        branches.MapGet("/by-employee", async (ICurrentUser current, IBranchService service, CancellationToken ct) =>
            Results.Ok(await service.GetByEmployeeAsync(current.RequireEmployeeId(), ct)));

        app.MapGet("/api/laboratories", async (IBranchService service, CancellationToken ct, long? branchId = null) =>
            Results.Ok(await service.ListLaboratoriesAsync(branchId, ct))).WithTags("Branches");

        app.MapGet("/api/operating-rooms", async (IBranchService service, CancellationToken ct, long? branchId = null) =>
            Results.Ok(await service.ListOperatingRoomsAsync(branchId, ct))).WithTags("Branches");
    }
}
