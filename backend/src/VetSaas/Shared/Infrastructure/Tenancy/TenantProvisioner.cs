using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Platform.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Shared.Infrastructure.Tenancy;

/// <summary>Datos para dar de alta una empresa: su identidad y el administrador con el que entrará por primera vez.</summary>
public sealed record NewTenant(
    string Slug,
    string Name,
    string AdminUsername,
    string AdminPassword,
    string? AdminEmail = null,
    string? BranchName = null,
    string? BranchLocation = null,
    string? Industry = null);

/// <summary>
/// Datos iniciales que cada módulo deja en el schema de una empresa recién creada (roles, catálogos base, administrador…).
/// Deben ser idempotentes: también corren al arrancar, sobre las empresas existentes, para sembrar lo que agregue una versión nueva.
/// </summary>
public interface ITenantSeeder
{
    /// <summary>Orden de ejecución (menor primero).</summary>
    int Order { get; }
    /// <param name="newTenant">Datos del alta; null cuando se re-siembra una empresa existente.</param>
    Task SeedAsync(TenantDbContext db, NewTenant? newTenant, CancellationToken ct);
}

public interface ITenantProvisioner
{
    /// <summary>Crea la empresa: registro en la plataforma, schema propio, tablas y datos iniciales.</summary>
    Task<Tenant> CreateAsync(NewTenant request, CancellationToken ct = default);
    /// <summary>Aplica las migraciones pendientes a la plataforma y al schema de cada empresa.</summary>
    Task MigrateAllAsync(CancellationToken ct = default);
}

public sealed class TenantProvisioner : ITenantProvisioner
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ITenantRegistry _registry;
    private readonly IClock _clock;
    private readonly ILogger<TenantProvisioner> _logger;

    public TenantProvisioner(IServiceScopeFactory scopes, ITenantRegistry registry, IClock clock,
        ILogger<TenantProvisioner> logger)
    {
        _scopes = scopes;
        _registry = registry;
        _clock = clock;
        _logger = logger;
    }

    public async Task<Tenant> CreateAsync(NewTenant request, CancellationToken ct = default)
    {
        string slug = (request.Slug ?? "").Trim().ToLowerInvariant();
        if (!TenantSchema.IsValidSlug(slug))
            throw new BadRequestException("El identificador de la empresa debe tener de 3 a 40 caracteres: minúsculas, números y guiones, empezando por una letra");
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new BadRequestException("El nombre de la empresa es obligatorio");
        if (string.IsNullOrWhiteSpace(request.AdminUsername))
            throw new BadRequestException("El usuario administrador es obligatorio");
        if (request.AdminPassword is null || request.AdminPassword.Length < 12)
            throw new BadRequestException("La contraseña del administrador debe tener al menos 12 caracteres");

        string schema = TenantSchema.FromSlug(slug);
        TenantSchema.EnsureValid(schema);

        await using AsyncServiceScope scope = _scopes.CreateAsyncScope();
        var platform = scope.ServiceProvider.GetRequiredService<PlatformDbContext>();

        if (await platform.Tenants.AnyAsync(t => t.Slug == slug || t.SchemaName == schema, ct))
            throw new BusinessRuleException("Ya existe una empresa con ese identificador");

        var tenant = new Tenant
        {
            Slug = slug,
            Name = request.Name.Trim(),
            SchemaName = schema,
            Status = TenantStatus.PROVISIONING,
            CreatedAt = _clock.Now,
        };
        platform.Tenants.Add(tenant);
        await platform.SaveChangesAsync(ct);

        // El nombre del schema no puede ir como parámetro; ya pasó la validación de TenantSchema (solo [a-z0-9_]).
#pragma warning disable EF1002
        try
        {
            await platform.Database.ExecuteSqlRawAsync($"CREATE SCHEMA IF NOT EXISTS \"{schema}\"", ct);
            await MigrateAndSeedAsync(tenant.ToInfo(), request with { Slug = slug }, ct);
        }
        catch
        {
            // Alta a medias: no se deja ni el schema ni el registro para que se pueda reintentar con el mismo identificador.
            await platform.Database.ExecuteSqlRawAsync($"DROP SCHEMA IF EXISTS \"{schema}\" CASCADE", CancellationToken.None);
            platform.Tenants.Remove(tenant);
            await platform.SaveChangesAsync(CancellationToken.None);
            throw;
        }
#pragma warning restore EF1002

        tenant.Status = TenantStatus.ACTIVE;
        await platform.SaveChangesAsync(ct);
        _registry.Invalidate(slug);
        _logger.LogInformation("Empresa '{Slug}' creada en el schema {Schema}", slug, schema);
        return tenant;
    }

    public async Task MigrateAllAsync(CancellationToken ct = default)
    {
        List<TenantInfo> tenants;
        await using (AsyncServiceScope scope = _scopes.CreateAsyncScope())
        {
            var platform = scope.ServiceProvider.GetRequiredService<PlatformDbContext>();
            await platform.Database.MigrateAsync(ct);
            tenants = (await platform.Tenants.AsNoTracking().OrderBy(t => t.CreatedAt).ToListAsync(ct))
                .Select(t => t.ToInfo()).ToList();
        }

        foreach (TenantInfo tenant in tenants)
        {
            await MigrateAndSeedAsync(tenant, null, ct);
            _logger.LogInformation("Schema {Schema} al día ({Slug})", tenant.Schema, tenant.Slug);
        }
    }

    /// <summary>Cada empresa se migra en su propio ámbito: el contexto de empresa de ese ámbito apunta a su schema.</summary>
    private async Task MigrateAndSeedAsync(TenantInfo tenant, NewTenant? newTenant, CancellationToken ct)
    {
        await using AsyncServiceScope scope = _scopes.CreateAsyncScope();
        scope.ServiceProvider.GetRequiredService<ITenantContext>().Use(tenant);
        var db = scope.ServiceProvider.GetRequiredService<TenantDbContext>();
        await db.Database.MigrateAsync(ct);

        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        foreach (ITenantSeeder seeder in scope.ServiceProvider.GetServices<ITenantSeeder>().OrderBy(s => s.Order))
            await seeder.SeedAsync(db, newTenant, ct);
        await transaction.CommitAsync(ct);
    }
}
