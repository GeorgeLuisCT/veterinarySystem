using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;

namespace VetSaas.Modules.Customers.Application;

public record BaseAnimalRequest
{
    public string? Name { get; init; }
    public long? OwnerId { get; init; }
    public AnimalSpecies? Species { get; init; }
    public string? Breed { get; init; }
    public DateOnly? BirthDate { get; init; }
}

public sealed record AnimalCreateRequest : BaseAnimalRequest;

public sealed record AnimalUpdateRequest : BaseAnimalRequest
{
    public long? Id { get; init; }
}

public abstract class BaseAnimalValidator<T> : AbstractValidator<T> where T : BaseAnimalRequest
{
    protected BaseAnimalValidator()
    {
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no puede estar vacío")
            .MaximumLength(100).WithMessage("El nombre no debe exceder los 100 caracteres");
        RuleFor(r => r.OwnerId).NotNull().WithMessage("El dueño del animal es obligatorio");
        RuleFor(r => r.Species).NotNull().WithMessage("La especie del animal es obligatoria");
        RuleFor(r => r.Breed).MaximumLength(100).WithMessage("La raza no debe exceder los 100 caracteres");
        RuleFor(r => r.BirthDate).NotNull().WithMessage("La fecha de nacimiento es obligatoria");
    }
}

public sealed class AnimalCreateRequestValidator : BaseAnimalValidator<AnimalCreateRequest>;

public sealed class AnimalUpdateRequestValidator : BaseAnimalValidator<AnimalUpdateRequest>
{
    public AnimalUpdateRequestValidator() =>
        RuleFor(r => r.Id).NotNull().WithMessage("El ID del animal es obligatorio");
}

public sealed record AnimalBasicResponse(long AnimalId, string AnimalName, string? AnimalPhotoUrl,
    AnimalSpecies AnimalSpecies, string? AnimalBreed, AnimalSex? Sex, string? MicrochipNumber)
{
    public static AnimalBasicResponse From(Animal animal) => new(animal.Id, animal.Name, animal.PhotoUrl,
        animal.Species, animal.Breed, animal.Sex, animal.MicrochipNumber);
}

public sealed record AnimalQuickSearchResponse(long Id, string Name, DateOnly BirthDate, string OwnerName,
    AnimalSpecies Species, string? PhotoUrl, string? MicrochipNumber);

/// <summary>Detalle del paciente; los campos sin valor no se envían.</summary>
public sealed record AnimalResponse(
    long Id,
    string Name,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? PhotoUrl,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] CustomerResponse? Owner,
    AnimalSpecies Species,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Breed,
    DateOnly BirthDate,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] AnimalSex? Sex,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? MicrochipNumber,
    IReadOnlyCollection<string> Allergies,
    IReadOnlyCollection<string> ChronicConditions,
    bool IsActive)
{
    public static AnimalResponse From(Animal animal) => new(animal.Id, animal.Name, animal.PhotoUrl,
        animal.Owner is null ? null : CustomerResponse.From(animal.Owner), animal.Species, animal.Breed,
        animal.BirthDate, animal.Sex, animal.MicrochipNumber, animal.Allergies, animal.ChronicConditions, animal.IsActive);
}

public sealed record AnimalSummaryResponse(long Id, string Name, DateOnly BirthDate, string? Breed,
    AnimalSpecies Species, string OwnerName, bool IsActive);

/// <summary>Historial de compras del paciente agrupado por categoría (hoy siempre vacío, como en el backend anterior).</summary>
public sealed record SaleProductsGrouped(IReadOnlyDictionary<string, List<object>> Categories)
{
    public static SaleProductsGrouped Empty() => new(new Dictionary<string, List<object>>());
}

public sealed record ClinicalHistoryResponse(AnimalResponse Animal, SaleProductsGrouped SaleProductsGrouped);

public interface IAnimalService
{
    Task<AnimalSummaryResponse> CreateAsync(AnimalCreateRequest request, CancellationToken ct = default);
    Task<AnimalResponse> GetAsync(long id, CancellationToken ct = default);
    Task<PaginatedResponse<AnimalSummaryResponse>> ListAsync(int page, int size, bool? active, string? query, CancellationToken ct = default);
    Task<List<AnimalQuickSearchResponse>> QuickSearchAsync(string? query, bool active, CancellationToken ct = default);
    Task<AnimalSummaryResponse> UpdateAsync(AnimalUpdateRequest request, CancellationToken ct = default);
    Task SoftDeleteAsync(long id, CancellationToken ct = default);
    Task HardDeleteAsync(long id, CancellationToken ct = default);
    Task<AnimalSummaryResponse> RestoreAsync(long id, CancellationToken ct = default);
    Task<ClinicalHistoryResponse> GetClinicalHistoryGroupedAsync(long animalId, CancellationToken ct = default);
}

public sealed class AnimalService : IAnimalService
{
    private readonly TenantDbContext _db;

    public AnimalService(TenantDbContext db) => _db = db;

    private async Task<Animal> RequireAsync(long id, string message, CancellationToken ct) =>
        await _db.Animals.Include(a => a.Owner).ThenInclude(o => o.DocumentType).FirstOrDefaultAsync(a => a.Id == id, ct)
        ?? throw new NotFoundException(message);

    private static AnimalSummaryResponse Summary(Animal a) =>
        new(a.Id, a.Name, a.BirthDate, a.Breed, a.Species, a.Owner.Name, a.IsActive);

    /// <summary>Texto libre sobre nombre, raza, especie y dueño (y microchip si se pide).</summary>
    private static IQueryable<Animal> Search(IQueryable<Animal> animals, string? query, bool includeMicrochip)
    {
        if (string.IsNullOrWhiteSpace(query)) return animals;
        string like = $"%{query.Trim()}%";
        return animals.Where(a =>
            EF.Functions.ILike(a.Name, like) || EF.Functions.ILike(a.Breed!, like) ||
            EF.Functions.ILike((string)(object)a.Species, like) || EF.Functions.ILike(a.Owner.Name, like) ||
            (includeMicrochip && EF.Functions.ILike(a.MicrochipNumber!, like)));
    }

    public async Task<AnimalSummaryResponse> CreateAsync(AnimalCreateRequest request, CancellationToken ct = default)
    {
        Customer owner = await _db.Customers.FirstOrDefaultAsync(c => c.Id == request.OwnerId, ct)
            ?? throw new NotFoundException("Dueño no encontrado");
        var animal = new Animal
        {
            Name = request.Name!,
            Owner = owner,
            Species = request.Species!.Value,
            Breed = request.Breed,
            BirthDate = request.BirthDate!.Value,
            IsActive = true,
        };
        _db.Animals.Add(animal);
        await _db.SaveChangesAsync(ct);
        return Summary(animal);
    }

    public async Task<AnimalResponse> GetAsync(long id, CancellationToken ct = default) =>
        AnimalResponse.From(await RequireAsync(id, "Animal no encontrado", ct));

    public async Task<PaginatedResponse<AnimalSummaryResponse>> ListAsync(int page, int size, bool? active, string? query,
        CancellationToken ct = default)
    {
        IQueryable<Animal> animals = _db.Animals.AsNoTracking();
        if (active is not null) animals = animals.Where(a => a.IsActive == active);
        return await Search(animals, query, includeMicrochip: false)
            .OrderBy(a => a.Name).ThenBy(a => a.Id)
            .Select(a => new AnimalSummaryResponse(a.Id, a.Name, a.BirthDate, a.Breed, a.Species, a.Owner.Name, a.IsActive))
            .ToPageAsync(page, size, ct);
    }

    public async Task<List<AnimalQuickSearchResponse>> QuickSearchAsync(string? query, bool active, CancellationToken ct = default) =>
        await Search(_db.Animals.AsNoTracking().Where(a => a.IsActive == active), query, includeMicrochip: true)
            .OrderBy(a => a.Name).Take(10)
            .Select(a => new AnimalQuickSearchResponse(a.Id, a.Name, a.BirthDate, a.Owner.Name, a.Species, a.PhotoUrl,
                a.MicrochipNumber))
            .ToListAsync(ct);

    public async Task<AnimalSummaryResponse> UpdateAsync(AnimalUpdateRequest request, CancellationToken ct = default)
    {
        Animal animal = await RequireAsync(request.Id!.Value, "Animal no encontrado", ct);
        Customer owner = await _db.Customers.FirstOrDefaultAsync(c => c.Id == request.OwnerId, ct)
            ?? throw new NotFoundException("Dueño no encontrado");
        animal.Name = request.Name!;
        animal.Owner = owner;
        animal.Species = request.Species!.Value;
        animal.Breed = request.Breed;
        animal.BirthDate = request.BirthDate!.Value;
        await _db.SaveChangesAsync(ct);
        return Summary(animal);
    }

    public async Task SoftDeleteAsync(long id, CancellationToken ct = default)
    {
        Animal animal = await RequireAsync(id, "Animal no encontrado", ct);
        animal.IsActive = false;
        await _db.SaveChangesAsync(ct);
    }

    public async Task HardDeleteAsync(long id, CancellationToken ct = default)
    {
        Animal animal = await RequireAsync(id, "Animal no encontrado", ct);
        _db.Animals.Remove(animal);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<AnimalSummaryResponse> RestoreAsync(long id, CancellationToken ct = default)
    {
        Animal animal = await RequireAsync(id, "Animal no encontrado", ct);
        animal.IsActive = true;
        await _db.SaveChangesAsync(ct);
        return Summary(animal);
    }

    public async Task<ClinicalHistoryResponse> GetClinicalHistoryGroupedAsync(long animalId, CancellationToken ct = default)
    {
        Animal animal = await RequireAsync(animalId, "Animal not found", ct);
        return new ClinicalHistoryResponse(AnimalResponse.From(animal), SaleProductsGrouped.Empty());
    }
}
