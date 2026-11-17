using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Users.Application;
using VetSaas.Modules.Users.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Validation;

namespace VetSaas.Modules.Users.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth").WithTags("Auth");

        auth.MapPost("/login", async (LoginRequest request, HttpContext context, IAuthService service, CancellationToken ct) =>
            Results.Ok(await service.AuthenticateAsync(context, request, ct)));

        auth.MapPost("/select-branch", async (BranchSelectionRequest request, IAuthService service, CancellationToken ct) =>
            Results.Ok(await service.SelectBranchAsync(request.BranchId, ct)));

        var users = app.MapGroup("/api/user").WithTags("Users");

        users.MapGet("/info", async (ICurrentUser current, IUserService service, CancellationToken ct) =>
            Results.Ok(await service.GetUserInfoAsync(current.RequireUserId(), current.BranchId, ct)));

        users.MapGet("/list", async (bool active, IUserService service, CancellationToken ct,
                int page = 0, int size = 10, long? branchId = null, string? q = null) =>
            Results.Ok(await service.GetAllUsersAsync(branchId, active, page, size, q, ct)))
            .RequireRoles(RoleName.ROLE_ADMIN);

        users.MapGet("/{userId:long}", async (long userId, IUserService service, CancellationToken ct) =>
            Results.Ok(await service.GetUserDetailAsync(userId, ct)))
            .RequireRoles(RoleName.ROLE_ADMIN);

        users.MapPatch("/{userId:long}/status", async (long userId, UserStatusUpdateRequest request, ICurrentUser current,
                IUserService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateUserStatusAsync(userId, request.Active!.Value, current.UserId, ct)))
            .Validate<UserStatusUpdateRequest>()
            .RequireRoles(RoleName.ROLE_ADMIN);

        users.MapDelete("/{userId:long}", async (long userId, ICurrentUser current, IUserService service, CancellationToken ct) =>
        {
            await service.DeleteUserAsync(userId, current.UserId, ct);
            return Results.Ok(new MessageResponse("Usuario eliminado correctamente"));
        }).RequireRoles(RoleName.ROLE_ADMIN);

        app.MapPost("/api/admin/register", async (RegisterRequest request, IUserService service, CancellationToken ct) =>
            Results.Ok(await service.RegisterUserAsync(request, ct)))
            .WithTags("Users")
            .Validate<RegisterRequest>()
            .RequireRoles(RoleName.ROLE_ADMIN);
    }
}
