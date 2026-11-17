using System.Collections.Concurrent;
using System.Globalization;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Clinic.Application;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Tenancy;
using VetSaas.Shared.Infrastructure.Time;
using VetSaas.Shared.Infrastructure.Validation;

namespace VetSaas.Modules.PublicPortal;

// ---- DTOs ----
public sealed record PublicCompanyResponse(string Name, string Industry);
public sealed record PublicAnimalSummaryResponse(long Id, string Name, string? PhotoUrl, AnimalSpecies? Species, string? SpeciesLabel, string? Breed,
    AnimalSex? Sex);
public sealed record PublicAppointmentResponse(long AppointmentId, AppointmentStatus Status, AppointmentType Type, DateTime RequestedStart,
    string BranchName, string AnimalName);

public sealed record PublicAppointmentRequest(long? DocumentTypeId, string? DocumentNumber, long? AnimalId, long? BranchId, AppointmentType? Type,
    DateTime? PreferredDateTime, int? EstimatedDurationMinutes, string? RequesterName, string? RequesterEmail, string? RequesterPhone, string? Notes);

public sealed class PublicAppointmentValidator : AbstractValidator<PublicAppointmentRequest>
{
    public PublicAppointmentValidator(IClock clock)
    {
        RuleFor(r => r.DocumentTypeId).NotNull().WithMessage("El tipo de documento es obligatorio");
        RuleFor(r => r.DocumentNumber).NotEmpty().WithMessage("Debes ingresar un número de documento.")
            .MaximumLength(64).WithMessage("El número de documento no debe superar 64 caracteres");
        RuleFor(r => r.AnimalId).NotNull().WithMessage("La mascota es obligatoria");
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sede es obligatoria");
        RuleFor(r => r.Type).NotNull().WithMessage("El tipo de cita es obligatorio");
        RuleFor(r => r.PreferredDateTime).NotNull().WithMessage("Selecciona la fecha y hora deseadas para la cita.")
            .Must(d => d is null || d.Value >= clock.Now.AddMinutes(-1)).WithMessage("La fecha de cita debe ser actual o posterior.");
        RuleFor(r => r.EstimatedDurationMinutes).GreaterThanOrEqualTo(0).When(r => r.EstimatedDurationMinutes is not null)
            .WithMessage("La duración estimada no puede ser negativa");
        RuleFor(r => r.RequesterName).NotEmpty().WithMessage("Indica el nombre de contacto para la cita.")
            .MaximumLength(160).WithMessage("El nombre de contacto no debe superar 160 caracteres");
        RuleFor(r => r.RequesterEmail).EmailAddress().WithMessage("El correo electrónico no es válido")
            .MaximumLength(160).WithMessage("El correo no debe superar 160 caracteres");
        RuleFor(r => r.RequesterPhone).MaximumLength(64).WithMessage("El teléfono no debe superar 64 caracteres");
        RuleFor(r => r.Notes).MaximumLength(2000).WithMessage("Las notas no deben superar 2000 caracteres");
    }
}

/// <summary>
/// Límite de intentos del portal (sin login): el documento de identidad no es un secreto, así que se frena la consulta
/// masiva/enumeración por IP y por documento (ventana deslizante en memoria, por instancia).
/// </summary>
public sealed class PublicPortalRateLimiter
{
    public const int MaxAttempts = 10;
    public static readonly TimeSpan Window = TimeSpan.FromMinutes(10);
    private readonly ConcurrentDictionary<string, Queue<DateTime>> _attempts = new();

    public void Check(string key)
    {
        DateTime now = DateTime.UtcNow, threshold = now - Window;
        Queue<DateTime> queue = _attempts.GetOrAdd(key, _ => new Queue<DateTime>());
        lock (queue)
        {
            while (queue.Count > 0 && queue.Peek() < threshold) queue.Dequeue();
            if (queue.Count >= MaxAttempts)
                throw new StatusException(StatusCodes.Status429TooManyRequests, "Demasiados intentos. Espera unos minutos antes de volver a consultar.");
            queue.Enqueue(now);
        }
        if (_attempts.Count > 10_000)
        {
            foreach ((string k, Queue<DateTime> q) in _attempts)
            {
                bool stale;
                lock (q) stale = q.Count == 0 || q.Last() < threshold;
                if (stale) _attempts.TryRemove(k, out _);
            }
        }
    }
}

public interface IPublicPortalService
{
    Task<PublicCompanyResponse> GetCompanyAsync(CancellationToken ct = default);
    Task<List<PublicAnimalSummaryResponse>> GetAnimalsAsync(long documentTypeId, string? documentNumber, CancellationToken ct = default);
    Task<ClinicalHistoryDetailResponse> GetClinicalHistoryAsync(long documentTypeId, string? documentNumber, long animalId, CancellationToken ct = default);
    Task<List<BranchResponse>> GetBranchesAsync(CancellationToken ct = default);
    Task<PublicAppointmentResponse> RequestAppointmentAsync(PublicAppointmentRequest r, CancellationToken ct = default);
}

public sealed class PublicPortalService : IPublicPortalService
{
    /// <summary>Mismo mensaje para documento inexistente, inactivo o de otro tipo: no permite averiguar qué clientes existen.</summary>
    private const string NotFoundMessage = "No encontramos un cliente con los datos proporcionados.";

    private readonly TenantDbContext _db;
    private readonly IBranchService _branches;
    private readonly IClinicalHistoryService _history;
    private readonly IClock _clock;

    public PublicPortalService(TenantDbContext db, IBranchService branches, IClinicalHistoryService history, IClock clock)
    {
        _db = db;
        _branches = branches;
        _history = history;
        _clock = clock;
    }

    public async Task<PublicCompanyResponse> GetCompanyAsync(CancellationToken ct = default)
    {
        var company = await _db.Companies.AsNoTracking().OrderBy(c => c.Id).FirstOrDefaultAsync(ct)
            ?? throw new BadRequestException("Información de la compañía no encontrada.");
        return new PublicCompanyResponse(company.Name, company.Industry);
    }

    public async Task<List<PublicAnimalSummaryResponse>> GetAnimalsAsync(long documentTypeId, string? documentNumber, CancellationToken ct = default)
    {
        Customer customer = await ResolveCustomerAsync(documentTypeId, documentNumber, ct);
        var animals = await _db.Animals.AsNoTracking().Where(a => a.OwnerId == customer.Id && a.IsActive).OrderBy(a => a.Name).ToListAsync(ct);
        return animals.Select(a => new PublicAnimalSummaryResponse(a.Id, a.Name, a.PhotoUrl, a.Species, SpeciesLabel(a.Species), a.Breed, a.Sex)).ToList();
    }

    public async Task<ClinicalHistoryDetailResponse> GetClinicalHistoryAsync(long documentTypeId, string? documentNumber, long animalId,
        CancellationToken ct = default)
    {
        Customer customer = await ResolveCustomerAsync(documentTypeId, documentNumber, ct);
        Animal animal = await RequireActiveAnimalAsync(animalId, ct);
        EnsureOwnership(animal, customer);
        return await _history.GetAnimalHistoryAsync(animalId, null, null, ct);
    }

    public Task<List<BranchResponse>> GetBranchesAsync(CancellationToken ct = default) => _branches.GetAllAsync(null, ct);

    public async Task<PublicAppointmentResponse> RequestAppointmentAsync(PublicAppointmentRequest r, CancellationToken ct = default)
    {
        Customer customer = await ResolveCustomerAsync(r.DocumentTypeId!.Value, r.DocumentNumber, ct);
        Animal animal = await RequireActiveAnimalAsync(r.AnimalId!.Value, ct);
        EnsureOwnership(animal, customer);
        var branch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == r.BranchId, ct) ?? throw new BadRequestException("La sede seleccionada no existe.");
        string requesterName = Trim(r.RequesterName) ?? throw new BadRequestException("Indica el nombre de contacto para la cita.");
        if (r.PreferredDateTime is null) throw new BadRequestException("Selecciona la fecha y hora deseadas para la cita.");
        if (r.PreferredDateTime.Value < _clock.Now.AddMinutes(-1)) throw new BadRequestException("La fecha de cita debe ser actual o posterior.");

        var appointment = new Appointment
        {
            AnimalId = animal.Id, BranchId = branch.Id, StartDateTime = r.PreferredDateTime.Value, EstimatedDurationMinutes = r.EstimatedDurationMinutes,
            Type = r.Type!.Value, Status = AppointmentStatus.REQUESTED, RequesterName = requesterName, RequesterEmail = Trim(r.RequesterEmail),
            RequesterPhone = Trim(r.RequesterPhone), RequestNotes = Trim(r.Notes),
        };
        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync(ct);
        return new PublicAppointmentResponse(appointment.Id, appointment.Status, appointment.Type, appointment.StartDateTime, branch.Name, animal.Name);
    }

    private async Task<Customer> ResolveCustomerAsync(long documentTypeId, string? documentNumber, CancellationToken ct)
    {
        string document = Trim(documentNumber) ?? throw new BadRequestException("Debes ingresar un número de documento.");
        if (!await _db.DocumentTypes.AnyAsync(d => d.Id == documentTypeId, ct))
            throw new BadRequestException("El tipo de documento seleccionado no es válido.");
        Customer? customer = await _db.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.DocumentNumber == document, ct);
        if (customer is null || !customer.IsActive || customer.DocumentTypeId != documentTypeId) throw new BadRequestException(NotFoundMessage);
        return customer;
    }

    private async Task<Animal> RequireActiveAnimalAsync(long animalId, CancellationToken ct)
    {
        Animal animal = await _db.Animals.AsNoTracking().FirstOrDefaultAsync(a => a.Id == animalId, ct)
            ?? throw new BadRequestException("La mascota indicada no existe.");
        if (!animal.IsActive) throw new BadRequestException("La mascota está inactiva. Comunícate con la clínica para más información.");
        return animal;
    }

    private static void EnsureOwnership(Animal animal, Customer customer)
    {
        if (animal.OwnerId != customer.Id) throw new BadRequestException("La mascota no pertenece al cliente autenticado.");
    }

    private static string? SpeciesLabel(AnimalSpecies? species)
    {
        if (species is null) return null;
        string lower = species.Value.ToString().Replace('_', ' ').ToLower(CultureInfo.InvariantCulture);
        return char.ToUpperInvariant(lower[0]) + lower[1..];
    }

    private static string? Trim(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();
}

public static class PublicPortalEndpoints
{
    public static IServiceCollection AddPublicPortal(this IServiceCollection services)
    {
        services.AddSingleton<PublicPortalRateLimiter>();
        services.AddScoped<IPublicPortalService, PublicPortalService>();
        return services;
    }

    /// <summary>Anónimo (AccessRules: /api/public/**). La empresa se resuelve por cabecera X-Tenant, ?company=, subdominio o única activa.</summary>
    public static void MapPublicPortalEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/public").WithTags("PublicPortal").AddEndpointFilter(async (ctx, next) =>
        {
            if (!ctx.HttpContext.RequestServices.GetRequiredService<ITenantContext>().HasTenant)
                throw new BadRequestException("No se pudo identificar la clínica. Ingresa desde el enlace de tu clínica.");
            return await next(ctx);
        });

        group.MapGet("/company", async (IPublicPortalService s, CancellationToken ct) => Results.Ok(await s.GetCompanyAsync(ct)));
        group.MapGet("/branches", async (IPublicPortalService s, CancellationToken ct) => Results.Ok(await s.GetBranchesAsync(ct)));
        group.MapGet("/clinical-history/animals", async (long documentTypeId, string documentNumber, HttpContext http, PublicPortalRateLimiter limiter,
            IPublicPortalService s, CancellationToken ct) =>
        {
            Throttle(http, limiter, documentNumber);
            return Results.Ok(await s.GetAnimalsAsync(documentTypeId, documentNumber, ct));
        });
        group.MapGet("/clinical-history", async (long documentTypeId, string documentNumber, long animalId, HttpContext http,
            PublicPortalRateLimiter limiter, IPublicPortalService s, CancellationToken ct) =>
        {
            Throttle(http, limiter, documentNumber);
            return Results.Ok(await s.GetClinicalHistoryAsync(documentTypeId, documentNumber, animalId, ct));
        });
        group.MapPost("/appointments/request", async (PublicAppointmentRequest r, HttpContext http, PublicPortalRateLimiter limiter,
            IPublicPortalService s, CancellationToken ct) =>
        {
            Throttle(http, limiter, r.DocumentNumber);
            return Results.Json(await s.RequestAppointmentAsync(r, ct), statusCode: StatusCodes.Status201Created);
        }).Validate<PublicAppointmentRequest>();
    }

    /// <summary>IP real (ya resuelta por ForwardedHeaders detrás de nginx) y documento por empresa: solo frena abuso, no autoriza.</summary>
    private static void Throttle(HttpContext http, PublicPortalRateLimiter limiter, string? documentNumber)
    {
        limiter.Check("ip:" + (http.Connection.RemoteIpAddress?.ToString() ?? "unknown"));
        if (!string.IsNullOrWhiteSpace(documentNumber))
        {
            string tenant = http.RequestServices.GetRequiredService<ITenantContext>().Current?.Slug ?? "";
            limiter.Check($"doc:{tenant}:{documentNumber.Trim()}");
        }
    }
}
