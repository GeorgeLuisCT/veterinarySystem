using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Time;
using VetSaas.Shared.Infrastructure.Validation;
using FluentValidation;
using static VetSaas.Modules.Users.Domain.RoleName;

namespace VetSaas.Modules.Catalogs;

public sealed record CatalogItemResponse(long Id, string Code, string Label, string? PluralLabel, string? Abbreviation, int SortOrder, bool Active);

public sealed record CatalogSummaryResponse(string Key, string Title, string Description, string Group, bool UsesAbbreviation,
    string? AbbreviationLabel, bool UsesPlural, int ActiveItems, int TotalItems);

public sealed record CatalogItemRequest(string? Label, string? PluralLabel, string? Abbreviation, bool? Active);

public sealed class CatalogItemValidator : AbstractValidator<CatalogItemRequest>
{
    public CatalogItemValidator()
    {
        RuleFor(r => r.Label).NotEmpty().WithMessage("El nombre es obligatorio").MaximumLength(120).WithMessage("El nombre no debe superar 120 caracteres");
        RuleFor(r => r.PluralLabel).MaximumLength(120).WithMessage("El plural no debe superar 120 caracteres");
        RuleFor(r => r.Abbreviation).MaximumLength(30).WithMessage("La abreviatura no debe superar 30 caracteres");
    }
}

public sealed record CatalogOrderRequest(List<long>? Ids);

public interface ICatalogService
{
    Task<IReadOnlyList<CatalogSummaryResponse>> ListCatalogsAsync(CancellationToken ct = default);
    /// <summary>Todos los valores de todos los catálogos (activos e inactivos), para que la app traduzca cualquier código guardado.</summary>
    Task<IReadOnlyDictionary<string, IReadOnlyList<CatalogItemResponse>>> AllItemsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<CatalogItemResponse>> ItemsAsync(string key, bool includeInactive, CancellationToken ct = default);
    /// <summary>Texto de cada código del catálogo (incluye inactivos); el código si no existe.</summary>
    Task<IReadOnlyDictionary<string, string>> LabelsAsync(string key, CancellationToken ct = default);
    Task<CatalogItemResponse> CreateAsync(string key, CatalogItemRequest r, CancellationToken ct = default);
    Task<CatalogItemResponse> UpdateAsync(string key, long id, CatalogItemRequest r, CancellationToken ct = default);
    Task DeleteAsync(string key, long id, CancellationToken ct = default);
    Task<IReadOnlyList<CatalogItemResponse>> ReorderAsync(string key, IReadOnlyList<long> ids, CancellationToken ct = default);
}

public sealed class CatalogService : ICatalogService
{
    private readonly TenantDbContext _db;
    private readonly IClock _clock;

    public CatalogService(TenantDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    private static CatalogDefinition Definition(string key) =>
        CatalogKeys.ByKey.TryGetValue(key, out CatalogDefinition? d) ? d : throw new NotFoundException("Catálogo no encontrado.");

    private static CatalogItemResponse ToResponse(CatalogItem i) => new(i.Id, i.Code, i.Label, i.PluralLabel, i.Abbreviation, i.SortOrder, i.Active);

    public async Task<IReadOnlyList<CatalogSummaryResponse>> ListCatalogsAsync(CancellationToken ct = default)
    {
        await _db.EnsureCatalogsSeededAsync(ct);
        var counts = await _db.CatalogItems.AsNoTracking().GroupBy(i => i.Catalog)
            .Select(g => new { g.Key, Total = g.Count(), Active = g.Count(i => i.Active) }).ToDictionaryAsync(x => x.Key, ct);
        return CatalogKeys.All.Select(d =>
        {
            counts.TryGetValue(d.Key, out var c);
            return new CatalogSummaryResponse(d.Key, d.Title, d.Description, d.Group, d.UsesAbbreviation, d.AbbreviationLabel, d.UsesPlural,
                c?.Active ?? 0, c?.Total ?? 0);
        }).ToList();
    }

    public async Task<IReadOnlyDictionary<string, IReadOnlyList<CatalogItemResponse>>> AllItemsAsync(CancellationToken ct = default)
    {
        await _db.EnsureCatalogsSeededAsync(ct);
        var items = await _db.CatalogItems.AsNoTracking().OrderBy(i => i.Catalog).ThenBy(i => i.SortOrder).ThenBy(i => i.Id).ToListAsync(ct);
        return CatalogKeys.All.ToDictionary(d => d.Key,
            d => (IReadOnlyList<CatalogItemResponse>)items.Where(i => i.Catalog == d.Key).Select(ToResponse).ToList());
    }

    public async Task<IReadOnlyList<CatalogItemResponse>> ItemsAsync(string key, bool includeInactive, CancellationToken ct = default)
    {
        Definition(key);
        await _db.EnsureCatalogsSeededAsync(ct);
        return await _db.CatalogItems.AsNoTracking().Where(i => i.Catalog == key && (includeInactive || i.Active))
            .OrderBy(i => i.SortOrder).ThenBy(i => i.Id).Select(i => ToResponse(i)).ToListAsync(ct);
    }

    public async Task<IReadOnlyDictionary<string, string>> LabelsAsync(string key, CancellationToken ct = default) =>
        (await ItemsAsync(key, includeInactive: true, ct)).ToDictionary(i => i.Code, i => i.Label);

    /// <summary>Código estable a partir del nombre: «Pipeta spot-on» → PIPETA_SPOT_ON (único dentro del catálogo).</summary>
    private async Task<string> NewCodeAsync(string key, string label, CancellationToken ct)
    {
        string plain = new string(label.Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray());
        var sb = new StringBuilder();
        foreach (char c in plain.ToUpperInvariant())
            sb.Append(char.IsAsciiLetterOrDigit(c) ? c : '_');
        string code = string.Join('_', sb.ToString().Split('_', StringSplitOptions.RemoveEmptyEntries));
        if (code.Length == 0) code = "VALOR";
        if (code.Length > 50) code = code[..50];

        var taken = (await _db.CatalogItems.AsNoTracking().Where(i => i.Catalog == key && i.Code.StartsWith(code)).Select(i => i.Code).ToListAsync(ct))
            .ToHashSet();
        if (!taken.Contains(code)) return code;
        for (int n = 2; ; n++)
            if (!taken.Contains($"{code}_{n}")) return $"{code}_{n}";
    }

    private static string? Clean(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();

    private async Task EnsureUniqueLabelAsync(string key, string label, long? exceptId, CancellationToken ct)
    {
        string lower = label.ToLower();
        if (await _db.CatalogItems.AnyAsync(i => i.Catalog == key && i.Label.ToLower() == lower && i.Id != exceptId, ct))
            throw new InvalidArgumentException($"Ya existe «{label}» en este catálogo.");
    }

    public async Task<CatalogItemResponse> CreateAsync(string key, CatalogItemRequest r, CancellationToken ct = default)
    {
        CatalogDefinition def = Definition(key);
        await _db.EnsureCatalogsSeededAsync(ct);
        string label = r.Label!.Trim();
        await EnsureUniqueLabelAsync(key, label, null, ct);
        int nextOrder = (await _db.CatalogItems.Where(i => i.Catalog == key).MaxAsync(i => (int?)i.SortOrder, ct) ?? 0) + 10;
        var item = new CatalogItem
        {
            Catalog = key, Code = await NewCodeAsync(key, label, ct), Label = label,
            PluralLabel = def.UsesPlural ? Clean(r.PluralLabel) : null,
            Abbreviation = def.UsesAbbreviation ? Clean(r.Abbreviation) : null,
            SortOrder = nextOrder, Active = r.Active ?? true, CreatedAt = _clock.Now, UpdatedAt = _clock.Now,
        };
        _db.CatalogItems.Add(item);
        await _db.SaveChangesAsync(ct);
        return ToResponse(item);
    }

    public async Task<CatalogItemResponse> UpdateAsync(string key, long id, CatalogItemRequest r, CancellationToken ct = default)
    {
        CatalogDefinition def = Definition(key);
        CatalogItem item = await _db.CatalogItems.FirstOrDefaultAsync(i => i.Id == id && i.Catalog == key, ct)
            ?? throw new NotFoundException("Valor de catálogo no encontrado.");
        string label = r.Label!.Trim();
        await EnsureUniqueLabelAsync(key, label, id, ct);
        item.Label = label;
        item.PluralLabel = def.UsesPlural ? Clean(r.PluralLabel) : null;
        item.Abbreviation = def.UsesAbbreviation ? Clean(r.Abbreviation) : null;
        if (r.Active is not null) item.Active = r.Active.Value;
        item.UpdatedAt = _clock.Now;
        await _db.SaveChangesAsync(ct);
        return ToResponse(item);
    }

    /// <summary>Solo se elimina un valor que ningún registro usa; si está en uso, se sugiere desactivarlo.</summary>
    public async Task DeleteAsync(string key, long id, CancellationToken ct = default)
    {
        Definition(key);
        CatalogItem item = await _db.CatalogItems.FirstOrDefaultAsync(i => i.Id == id && i.Catalog == key, ct)
            ?? throw new NotFoundException("Valor de catálogo no encontrado.");
        if (await _db.IsCatalogCodeInUseAsync(key, item.Code, ct))
            throw new BusinessRuleException($"«{item.Label}» está en uso y no se puede eliminar. Desactívalo para que no se ofrezca más.");
        _db.CatalogItems.Remove(item);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<CatalogItemResponse>> ReorderAsync(string key, IReadOnlyList<long> ids, CancellationToken ct = default)
    {
        Definition(key);
        var items = await _db.CatalogItems.Where(i => i.Catalog == key).ToListAsync(ct);
        var position = ids.Select((id, index) => (id, index)).ToDictionary(x => x.id, x => x.index);
        int tail = ids.Count;
        foreach (CatalogItem i in items.OrderBy(i => position.TryGetValue(i.Id, out int p) ? p : tail + i.SortOrder))
            i.SortOrder = (position.TryGetValue(i.Id, out int p) ? p : tail++) * 10 + 10;
        await _db.SaveChangesAsync(ct);
        return await ItemsAsync(key, includeInactive: true, ct);
    }
}

public static class CatalogEndpoints
{
    public static IServiceCollection AddCatalogs(this IServiceCollection services)
    {
        services.AddScoped<ICatalogService, CatalogService>();
        return services;
    }

    /// <summary>Lectura: cualquier usuario con sesión. Edición: ADMIN y MANAGER.</summary>
    public static void MapCatalogEndpoints(this WebApplication app)
    {
        var g = app.MapGroup("/api/catalogs").WithTags("Catalogs");
        g.MapGet("/", async (ICatalogService s, CancellationToken ct) => Results.Ok(await s.ListCatalogsAsync(ct)));
        g.MapGet("/items", async (ICatalogService s, CancellationToken ct) => Results.Ok(await s.AllItemsAsync(ct)));
        g.MapGet("/{key}", async (string key, ICatalogService s, CancellationToken ct, bool includeInactive = false) =>
            Results.Ok(await s.ItemsAsync(key, includeInactive, ct)));
        g.MapPost("/{key}", async (string key, CatalogItemRequest r, ICatalogService s, CancellationToken ct) =>
            Results.Json(await s.CreateAsync(key, r, ct), statusCode: StatusCodes.Status201Created))
            .Validate<CatalogItemRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER);
        g.MapPut("/{key}/{id:long}", async (string key, long id, CatalogItemRequest r, ICatalogService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(key, id, r, ct))).Validate<CatalogItemRequest>().RequireRoles(ROLE_ADMIN, ROLE_MANAGER);
        g.MapDelete("/{key}/{id:long}", async (string key, long id, ICatalogService s, CancellationToken ct) =>
        {
            await s.DeleteAsync(key, id, ct);
            return Results.NoContent();
        }).RequireRoles(ROLE_ADMIN, ROLE_MANAGER);
        g.MapPut("/{key}/order", async (string key, CatalogOrderRequest r, ICatalogService s, CancellationToken ct) =>
            Results.Ok(await s.ReorderAsync(key, r.Ids ?? new(), ct))).RequireRoles(ROLE_ADMIN, ROLE_MANAGER);
    }
}
