using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using VetSaas;
using VetSaas.Modules.Platform;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Json;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Tenancy;
using VetSaas.Shared.Infrastructure.Time;
using VetSaas.Shared.Middlewares;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, logger) => logger
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console());

string connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Falta la cadena de conexión (ConnectionStrings:Default).");

// ---- Persistencia: un contexto de plataforma y uno de negocio que apunta al schema de la empresa de la petición ----
builder.Services.AddDbContext<PlatformDbContext>(options => PersistenceSetup.ConfigurePlatform(options, connectionString));
builder.Services.AddDbContext<TenantDbContext>(options => PersistenceSetup.ConfigureTenant(options, connectionString));

// ---- Multi-tenant por schema ----
builder.Services.AddScoped<ITenantContext, TenantContext>();
builder.Services.AddSingleton<ITenantRegistry, TenantRegistry>();
builder.Services.AddSingleton<ITenantResolver, TenantResolver>();
builder.Services.AddSingleton<ITenantProvisioner, TenantProvisioner>();
builder.Services.AddMemoryCache();

// ---- Seguridad ----
var jwtOptions = new JwtOptions
{
    Secret = builder.Configuration["Jwt:Secret"] ?? "",
    ExpirationMs = builder.Configuration.GetValue<long?>("Jwt:ExpirationMs") ?? 86_400_000,
};
builder.Services.AddSingleton(jwtOptions);
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Los claims se leen con su nombre original (userId, roles, tenant…), sin el renombrado de .NET.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = jwtOptions.SigningKey(),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = "sub",
            RoleClaimType = AppClaims.Roles,
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Panel de plataforma: solo tokens con el claim is_superadmin=true.
    options.AddPolicy(PlatformEndpoints.SuperAdminPolicy, policy => policy
        .RequireAuthenticatedUser()
        .RequireClaim(AppClaims.IsSuperAdmin, "true"));
});

// Detrás de nginx la IP real y el esquema llegan en X-Forwarded-*.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = builder.Configuration.GetValue("Proxy:ForwardLimit", 1);
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

string[] corsOrigins = (builder.Configuration["Cors:Origins"] ?? "http://localhost:3000")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(corsOrigins)
    .AllowAnyHeader()
    .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
    .AllowCredentials()));

builder.Services.ConfigureHttpJsonOptions(options => JsonSetup.Configure(options.SerializerOptions));
builder.Services.AddValidatorsFromAssemblyContaining<Program>(includeInternalTypes: true);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options => options.CustomSchemaIds(type => type.FullName?.Replace('+', '.')));

builder.Services.AddModules();

var app = builder.Build();

app.UseForwardedHeaders();
app.UseMiddleware<ExceptionMiddleware>();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" })).ExcludeFromDescription();
app.MapModules();

// Una ruta de la API que no existe responde con el mismo formato de error que el resto.
app.MapFallback("/api/{**path}", () =>
{
    throw new NotFoundException("Recurso no encontrado");
});

// Al arrancar: migraciones de la plataforma y del schema de cada empresa, y datos iniciales.
if (!args.Contains("--no-migrate"))
{
    await app.Services.GetRequiredService<ITenantProvisioner>().MigrateAllAsync();
    await using AsyncServiceScope scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<IPlatformService>().BootstrapAsync();
}

app.Run();

public partial class Program { }
