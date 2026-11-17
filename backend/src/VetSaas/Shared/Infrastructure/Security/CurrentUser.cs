using System.Security.Claims;
using VetSaas.Modules.Users.Domain;
using VetSaas.Shared.Application;

namespace VetSaas.Shared.Infrastructure.Security;

/// <summary>Usuario de la petición, leído del JWT (equivale a JwtTokenProvider del backend anterior).</summary>
public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    long? UserId { get; }
    long? EmployeeId { get; }
    /// <summary>Sucursal elegida en la sesión; null si aún no eligió (o trabaja sobre todas).</summary>
    long? BranchId { get; }
    string? Username { get; }
    IReadOnlyCollection<string> Roles { get; }
    bool HasAnyRole(params RoleName[] roles);
    /// <summary>Id del usuario; 401 si la petición no trae sesión.</summary>
    long RequireUserId();
    long RequireEmployeeId();
}

public sealed class CurrentUser : ICurrentUser
{
    private readonly ClaimsPrincipal? _principal;

    public CurrentUser(IHttpContextAccessor accessor) => _principal = accessor.HttpContext?.User;

    public bool IsAuthenticated => _principal?.Identity?.IsAuthenticated == true;
    public long? UserId => Long(AppClaims.UserId);
    public long? EmployeeId => Long(AppClaims.EmployeeId);
    public long? BranchId => Long(AppClaims.BranchId);
    public string? Username => _principal?.FindFirstValue("sub");

    public IReadOnlyCollection<string> Roles =>
        _principal?.FindAll(AppClaims.Roles).Select(claim => claim.Value).ToList() ?? new List<string>();

    public bool HasAnyRole(params RoleName[] roles) => _principal.HasAnyRole(roles);

    public long RequireUserId() => UserId ?? throw new UnauthorizedException("No se pudo autenticar la solicitud");
    public long RequireEmployeeId() => EmployeeId ?? throw new UnauthorizedException("No se pudo autenticar la solicitud");

    private long? Long(string claim) =>
        long.TryParse(_principal?.FindFirstValue(claim), out long value) ? value : null;
}

public static class ClaimsPrincipalExtensions
{
    public static bool HasAnyRole(this ClaimsPrincipal? principal, params RoleName[] roles)
    {
        if (principal is null) return false;
        foreach (RoleName role in roles)
            if (principal.HasClaim(AppClaims.Roles, role.ToString())) return true;
        return false;
    }
}
