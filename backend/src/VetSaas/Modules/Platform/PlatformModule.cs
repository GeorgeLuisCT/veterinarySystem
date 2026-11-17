using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Platform.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Tenancy;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Platform;

public sealed record PlatformLoginRequest(string? Email, string? Password);

public sealed record PlatformLoginResponse(string Token, string Name, string Email);

public sealed record TenantResponse(Guid Id, string Slug, string Name, string Schema, TenantStatus Status, DateTime CreatedAt)
{
    public static TenantResponse From(Tenant tenant) =>
        new(tenant.Id, tenant.Slug, tenant.Name, tenant.SchemaName, tenant.Status, tenant.CreatedAt);
}

public sealed record CreateTenantRequest(
    string? Slug,
    string? Name,
    string? AdminUsername,
    string? AdminPassword,
    string? AdminEmail,
    string? BranchName,
    string? BranchLocation,
    string? Industry);

public interface IPlatformService
{
    Task<PlatformLoginResponse> LoginAsync(PlatformLoginRequest request, CancellationToken ct = default);
    Task<List<TenantResponse>> ListTenantsAsync(CancellationToken ct = default);
    Task<TenantResponse> GetTenantAsync(Guid id, CancellationToken ct = default);
    Task<TenantResponse> CreateTenantAsync(CreateTenantRequest request, CancellationToken ct = default);
    Task<TenantResponse> SetStatusAsync(Guid id, TenantStatus status, CancellationToken ct = default);
    /// <summary>Crea el superadmin inicial y, si se configuró, la primera empresa (solo cuando aún no existen).</summary>
    Task BootstrapAsync(CancellationToken ct = default);
}

public sealed class PlatformService : IPlatformService
{
    private readonly PlatformDbContext _db;
    private readonly ITenantProvisioner _provisioner;
    private readonly ITenantRegistry _registry;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtService _jwt;
    private readonly IClock _clock;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PlatformService> _logger;

    public PlatformService(PlatformDbContext db, ITenantProvisioner provisioner, ITenantRegistry registry,
        IPasswordHasher hasher, IJwtService jwt, IClock clock, IConfiguration configuration, ILogger<PlatformService> logger)
    {
        _db = db;
        _provisioner = provisioner;
        _registry = registry;
        _hasher = hasher;
        _jwt = jwt;
        _clock = clock;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<PlatformLoginResponse> LoginAsync(PlatformLoginRequest request, CancellationToken ct = default)
    {
        string email = (request.Email ?? "").Trim().ToLowerInvariant();
        PlatformAdmin? admin = await _db.Admins.AsNoTracking().FirstOrDefaultAsync(a => a.Email == email, ct);
        if (admin is null || !admin.IsActive || !_hasher.Verify(request.Password ?? "", admin.PasswordHash))
            throw new UnauthorizedException("Usuario o contraseña incorrectos");
        return new PlatformLoginResponse(_jwt.CreatePlatformToken(admin.Id, admin.Email), admin.Name, admin.Email);
    }

    public async Task<List<TenantResponse>> ListTenantsAsync(CancellationToken ct = default) =>
        (await _db.Tenants.AsNoTracking().OrderBy(t => t.CreatedAt).ToListAsync(ct)).Select(TenantResponse.From).ToList();

    public async Task<TenantResponse> GetTenantAsync(Guid id, CancellationToken ct = default) =>
        TenantResponse.From(await RequireAsync(id, ct));

    public async Task<TenantResponse> CreateTenantAsync(CreateTenantRequest request, CancellationToken ct = default)
    {
        Tenant tenant = await _provisioner.CreateAsync(new NewTenant(
            request.Slug ?? "", request.Name ?? "", request.AdminUsername ?? "", request.AdminPassword ?? "",
            request.AdminEmail, request.BranchName, request.BranchLocation, request.Industry), ct);
        return TenantResponse.From(tenant);
    }

    public async Task<TenantResponse> SetStatusAsync(Guid id, TenantStatus status, CancellationToken ct = default)
    {
        Tenant tenant = await RequireAsync(id, ct);
        if (tenant.Status == TenantStatus.PROVISIONING)
            throw new BusinessRuleException("La empresa todavía se está creando");
        tenant.Status = status;
        await _db.SaveChangesAsync(ct);
        _registry.Invalidate(tenant.Slug);
        return TenantResponse.From(tenant);
    }

    private async Task<Tenant> RequireAsync(Guid id, CancellationToken ct) =>
        await _db.Tenants.FirstOrDefaultAsync(t => t.Id == id, ct) ?? throw new NotFoundException("Empresa no encontrada");

    public async Task BootstrapAsync(CancellationToken ct = default)
    {
        string? email = _configuration["Platform:BootstrapAdminEmail"]?.Trim().ToLowerInvariant();
        string? password = _configuration["Platform:BootstrapAdminPassword"];
        if (!await _db.Admins.AnyAsync(ct))
        {
            // Seguridad: sin credenciales explícitas no se crea ningún superadmin por defecto.
            if (string.IsNullOrEmpty(email) || password is null || password.Length < 12)
                _logger.LogWarning("No existe ningún superadmin y no se definió Platform:BootstrapAdminEmail / " +
                                   "Platform:BootstrapAdminPassword (mínimo 12 caracteres). Defínalos para crear el inicial.");
            else
            {
                _db.Admins.Add(new PlatformAdmin
                {
                    Email = email, Name = "Superadmin", PasswordHash = _hasher.Hash(password), CreatedAt = _clock.Now,
                });
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("Superadmin inicial '{Email}' creado.", email);
            }
        }

        // Primera empresa opcional, para que una instalación nueva quede lista sin pasar por el panel.
        string? slug = _configuration["Tenancy:BootstrapTenant:Slug"];
        if (!string.IsNullOrWhiteSpace(slug) && !await _db.Tenants.AnyAsync(ct))
        {
            IConfigurationSection section = _configuration.GetSection("Tenancy:BootstrapTenant");
            await _provisioner.CreateAsync(new NewTenant(
                slug, section["Name"] ?? slug, section["AdminUsername"] ?? "", section["AdminPassword"] ?? "",
                section["AdminEmail"], section["BranchName"], section["BranchLocation"], section["Industry"]), ct);
        }
    }
}

public static class PlatformEndpoints
{
    public const string SuperAdminPolicy = "SuperAdmin";

    public static void MapPlatformEndpoints(this WebApplication app)
    {
        app.MapPost("/api/platform/auth/login", async (PlatformLoginRequest request, IPlatformService service, CancellationToken ct) =>
            Results.Ok(await service.LoginAsync(request, ct))).WithTags("Platform");

        var tenants = app.MapGroup("/api/platform/tenants").WithTags("Platform").RequireAuthorization(SuperAdminPolicy);

        tenants.MapGet("/", async (IPlatformService service, CancellationToken ct) =>
            Results.Ok(await service.ListTenantsAsync(ct)));

        tenants.MapGet("/{id:guid}", async (Guid id, IPlatformService service, CancellationToken ct) =>
            Results.Ok(await service.GetTenantAsync(id, ct)));

        tenants.MapPost("/", async (CreateTenantRequest request, IPlatformService service, CancellationToken ct) =>
        {
            TenantResponse created = await service.CreateTenantAsync(request, ct);
            return Results.Created($"/api/platform/tenants/{created.Id}", created);
        });

        tenants.MapPost("/{id:guid}/suspend", async (Guid id, IPlatformService service, CancellationToken ct) =>
            Results.Ok(await service.SetStatusAsync(id, TenantStatus.SUSPENDED, ct)));

        tenants.MapPost("/{id:guid}/activate", async (Guid id, IPlatformService service, CancellationToken ct) =>
            Results.Ok(await service.SetStatusAsync(id, TenantStatus.ACTIVE, ct)));
    }
}
