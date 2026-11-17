using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Security;

namespace VetSaas.Shared.Infrastructure.Tenancy;

/// <summary>Catálogo de empresas (schema «platform») con caché corta: se consulta en cada petición.</summary>
public interface ITenantRegistry
{
    Task<TenantInfo?> FindBySlugAsync(string slug, CancellationToken ct = default);
    /// <summary>Si la plataforma tiene exactamente una empresa activa, la devuelve (instalación de una sola clínica).</summary>
    Task<TenantInfo?> FindOnlyTenantAsync(CancellationToken ct = default);
    void Invalidate(string slug);
}

public sealed class TenantRegistry : ITenantRegistry
{
    private static readonly TimeSpan CacheTime = TimeSpan.FromSeconds(30);
    private const string OnlyTenantKey = "tenant:only";

    private readonly IServiceScopeFactory _scopes;
    private readonly IMemoryCache _cache;

    public TenantRegistry(IServiceScopeFactory scopes, IMemoryCache cache)
    {
        _scopes = scopes;
        _cache = cache;
    }

    public async Task<TenantInfo?> FindBySlugAsync(string slug, CancellationToken ct = default)
    {
        slug = slug.Trim().ToLowerInvariant();
        if (!TenantSchema.IsValidSlug(slug)) return null;
        return await _cache.GetOrCreateAsync("tenant:" + slug, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheTime;
            await using AsyncServiceScope scope = _scopes.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<PlatformDbContext>();
            var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Slug == slug, ct);
            return tenant?.ToInfo();
        });
    }

    public async Task<TenantInfo?> FindOnlyTenantAsync(CancellationToken ct = default)
    {
        return await _cache.GetOrCreateAsync(OnlyTenantKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheTime;
            await using AsyncServiceScope scope = _scopes.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<PlatformDbContext>();
            var tenants = await db.Tenants.AsNoTracking()
                .Where(t => t.Status == TenantStatus.ACTIVE).Take(2).ToListAsync(ct);
            return tenants.Count == 1 ? tenants[0].ToInfo() : null;
        });
    }

    public void Invalidate(string slug)
    {
        _cache.Remove("tenant:" + slug);
        _cache.Remove(OnlyTenantKey);
    }
}

/// <summary>
/// Decide a qué empresa pertenece una petición SIN sesión (login y portal público).
/// Orden: slug explícito → cabecera X-Tenant → parámetro ?company= → subdominio → única empresa de la instalación.
/// </summary>
public interface ITenantResolver
{
    Task<TenantInfo?> ResolveAnonymousAsync(HttpContext context, string? explicitSlug = null, CancellationToken ct = default);
}

public sealed class TenantResolver : ITenantResolver
{
    public const string Header = "X-Tenant";
    private readonly ITenantRegistry _registry;
    private readonly string? _baseDomain;

    public TenantResolver(ITenantRegistry registry, IConfiguration configuration)
    {
        _registry = registry;
        _baseDomain = configuration["Tenancy:BaseDomain"]?.Trim().TrimStart('.').ToLowerInvariant();
    }

    public async Task<TenantInfo?> ResolveAnonymousAsync(HttpContext context, string? explicitSlug = null,
        CancellationToken ct = default)
    {
        string? slug = FirstNonBlank(
            explicitSlug,
            context.Request.Headers[Header].FirstOrDefault(),
            context.Request.Query["company"].FirstOrDefault(),
            SlugFromHost(context.Request.Host.Host));

        // Si se nombró una empresa y no existe, no se cae en otra.
        if (slug is not null) return await _registry.FindBySlugAsync(slug, ct);
        return await _registry.FindOnlyTenantAsync(ct);
    }

    private string? SlugFromHost(string host)
    {
        if (string.IsNullOrEmpty(_baseDomain)) return null;
        host = host.ToLowerInvariant();
        string suffix = "." + _baseDomain;
        if (!host.EndsWith(suffix, StringComparison.Ordinal)) return null;
        string sub = host[..^suffix.Length];
        return sub.Length == 0 || sub.Contains('.') || sub == "www" ? null : sub;
    }

    private static string? FirstNonBlank(params string?[] values) =>
        values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();
}

/// <summary>
/// Fija la empresa de la petición antes de tocar datos de negocio y aplica las reglas de acceso por ruta.
/// Con sesión, la empresa sale del JWT; sin sesión (rutas públicas), del resolvedor anónimo.
/// </summary>
public sealed class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext, ITenantRegistry registry,
        ITenantResolver resolver)
    {
        AccessRules.Enforce(context);

        if (context.User.Identity?.IsAuthenticated == true)
        {
            string? slug = context.User.FindFirst(AppClaims.Tenant)?.Value;
            if (slug is not null)
            {
                TenantInfo tenant = await registry.FindBySlugAsync(slug, context.RequestAborted)
                    ?? throw new UnauthorizedException("La empresa de la sesión ya no existe");
                if (tenant.Status != TenantStatus.ACTIVE)
                    throw new StatusException(StatusCodes.Status403Forbidden, "La empresa está suspendida. Contacta al proveedor del servicio");
                tenantContext.Use(tenant);
            }
        }
        else if (context.Request.Path.StartsWithSegments("/api")
                 && !context.Request.Path.StartsWithSegments("/api/platform")
                 && !context.Request.Path.StartsWithSegments("/api/auth")
                 && AccessRules.IsAnonymous(context.Request))
        {
            // Portal público y catálogos abiertos: la empresa viene en la cabecera, el parámetro o el subdominio.
            TenantInfo? tenant = await resolver.ResolveAnonymousAsync(context, ct: context.RequestAborted);
            if (tenant is { Status: TenantStatus.ACTIVE }) tenantContext.Use(tenant);
        }

        await _next(context);
    }
}
