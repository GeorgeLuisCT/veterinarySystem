using VetSaas.Modules.Users.Domain;
using VetSaas.Shared.Application;
using static VetSaas.Modules.Users.Domain.RoleName;

namespace VetSaas.Shared.Infrastructure.Security;

/// <summary>
/// Reglas de acceso por ruta, en un solo lugar (equivale a SecurityConfig del backend anterior).
/// Se evalúan en orden y gana la primera que coincide; lo que no coincide con ninguna exige sesión.
/// Los permisos finos por operación se declaran en cada endpoint con <c>RequireRoles</c>.
/// </summary>
public static class AccessRules
{
    private sealed record Rule(string? Method, string[] Patterns, bool Anonymous, RoleName[] Roles);

    private static Rule Public(params string[] patterns) => new(null, patterns, true, Array.Empty<RoleName>());
    private static Rule Any(string[] patterns, params RoleName[] roles) => new(null, patterns, false, roles);
    private static Rule Get(string[] patterns, params RoleName[] roles) => new("GET", patterns, false, roles);
    private static Rule Post(string[] patterns, params RoleName[] roles) => new("POST", patterns, false, roles);
    private static string[] P(params string[] patterns) => patterns;

    private static readonly Rule[] Rules =
    {
        Public("/api/auth/login"),
        Public("/api/public/**"),
        Public("/api/document-types/**"),
        Public("/api/platform/auth/login"),
        Public("/api/health"),

        Any(P("/api/admin/**"), ROLE_ADMIN),
        Any(P("/api/veterinarian/**"), ROLE_VETERINARIAN),
        Any(P("/api/assistant/**"), ROLE_ASSISTANT),
        Any(P("/api/receptionist/**"), ROLE_RECEPTIONIST),
        Any(P("/api/manager/**"), ROLE_MANAGER),
        Any(P("/api/groomer/**"), ROLE_GROOMER),
        Any(P("/api/supervisor/**"), ROLE_SUPERVISOR),
        Any(P("/api/warehouse/**"), ROLE_WAREHOUSE),
        Any(P("/api/cashier/**"), ROLE_CASHIER),

        // Finanzas: solo administración. La lista de cuentas de tesorería se lee también al cerrar caja (cajero) y en reportes (gerente).
        Any(P("/api/finance/**", "/api/accounts-payable/**"), ROLE_ADMIN),
        Get(P("/api/treasury-accounts", "/api/treasury-accounts/*"), ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER),
        Any(P("/api/treasury-accounts/**"), ROLE_ADMIN),

        // Caja
        Get(P("/api/cash-sessions/active"), ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_RECEPTIONIST),
        Get(P("/api/cash-sessions/history"), ROLE_ADMIN, ROLE_MANAGER),
        Any(P("/api/cash-sessions/**"), ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER),

        // Ventas: anular es una decisión de supervisión
        Post(P("/api/sales/*/void"), ROLE_ADMIN, ROLE_MANAGER),
        Any(P("/api/sales/**"), ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_RECEPTIONIST),

        // Reportes
        Any(P("/api/reports/**"), ROLE_ADMIN, ROLE_MANAGER),

        // Veterinaria de campo
        Any(P("/api/fieldwork/**", "/api/farms/**", "/api/geo-zones/**"), ROLE_ADMIN, ROLE_MANAGER, ROLE_VETERINARIAN),

        // Módulo clínico (datos clínicos: solo personal clínico)
        Any(P("/api/clinical-attentions/**", "/api/hospitalizations/**", "/api/cages/**",
            "/api/surgical-reports/**", "/api/laboratory-requests/**"), ROLE_ADMIN, ROLE_MANAGER, ROLE_VETERINARIAN, ROLE_ASSISTANT),
        // Catálogos clínicos: lectura general, escritura de veterinaria/administración
        Get(P("/api/prescription-templates/**", "/api/health-plans/**", "/api/laboratory-tests/**", "/api/clinical-services/**")),
        Any(P("/api/prescription-templates/**", "/api/health-plans/**", "/api/laboratory-tests/**", "/api/clinical-services/**"),
            ROLE_ADMIN, ROLE_MANAGER, ROLE_VETERINARIAN),

        // Peluquería
        Any(P("/api/grooming-sessions/**"), ROLE_ADMIN, ROLE_MANAGER, ROLE_GROOMER, ROLE_RECEPTIONIST),
    };

    public static bool IsAnonymous(HttpRequest request)
    {
        Rule? rule = Match(request);
        return rule is { Anonymous: true };
    }

    /// <summary>Lanza 401/403 si la petición no cumple la regla de su ruta.</summary>
    public static void Enforce(HttpContext context)
    {
        // El preflight de CORS nunca lleva credenciales.
        if (HttpMethods.IsOptions(context.Request.Method)) return;
        if (!context.Request.Path.StartsWithSegments("/api")) return;

        Rule? rule = Match(context.Request);
        if (rule is { Anonymous: true }) return;

        if (context.User.Identity?.IsAuthenticated != true)
            throw new UnauthorizedException("No se pudo autenticar la solicitud");

        // El panel de plataforma se protege con su propia política (SuperAdmin) en los endpoints.
        if (context.Request.Path.StartsWithSegments("/api/platform")) return;

        // Un token de plataforma no es una sesión de empresa: no entra a los datos de negocio.
        if (context.User.HasClaim(AppClaims.IsSuperAdmin, "true"))
            throw new ForbiddenException();

        if (rule is not null && rule.Roles.Length > 0 && !context.User.HasAnyRole(rule.Roles))
            throw new ForbiddenException();
    }

    private static Rule? Match(HttpRequest request)
    {
        string path = request.Path.Value ?? "/";
        foreach (Rule rule in Rules)
        {
            if (rule.Method is not null && !string.Equals(rule.Method, request.Method, StringComparison.OrdinalIgnoreCase))
                continue;
            foreach (string pattern in rule.Patterns)
                if (AntMatch(pattern, path)) return rule;
        }
        return null;
    }

    /// <summary>Coincidencia estilo Ant: «*» es un segmento, «**» al final es cualquier resto (incluido ninguno).</summary>
    internal static bool AntMatch(string pattern, string path)
    {
        string[] patternSegments = pattern.Split('/', StringSplitOptions.RemoveEmptyEntries);
        string[] pathSegments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        for (int i = 0; i < patternSegments.Length; i++)
        {
            if (patternSegments[i] == "**") return true;
            if (i >= pathSegments.Length) return false;
            if (patternSegments[i] != "*" && !string.Equals(patternSegments[i], pathSegments[i], StringComparison.Ordinal))
                return false;
        }
        return patternSegments.Length == pathSegments.Length;
    }
}

public static class RoleEndpointExtensions
{
    /// <summary>Exige alguno de los roles en este endpoint o grupo (equivale a @PreAuthorize("hasAnyRole(...)")).</summary>
    public static TBuilder RequireRoles<TBuilder>(this TBuilder builder, params RoleName[] roles)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.AddEndpointFilter(async (invocation, next) =>
        {
            if (!invocation.HttpContext.User.HasAnyRole(roles)) throw new ForbiddenException();
            return await next(invocation);
        });
        return builder;
    }
}
