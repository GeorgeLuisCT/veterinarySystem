using Microsoft.EntityFrameworkCore;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Time;
using static VetSaas.Modules.Users.Domain.RoleName;

namespace VetSaas.Modules.Preferences;

public sealed record PreferenceItemResponse(
    string Key, string Label, string Description, string Type, string Default, string Value,
    /// <summary>«own» = lo cambió este nivel · «company» = lo hereda de la empresa · «default» = el predeterminado.</summary>
    string Source, int? Min, int? Max, string? Unit, string? Hint, IReadOnlyList<PrefOption> Options);

public sealed record PreferenceGroupResponse(string Key, string Label, string Description, IReadOnlyList<PreferenceItemResponse> Items);

public sealed record PreferenceSectionResponse(IReadOnlyList<PreferenceGroupResponse> Groups);

public sealed record SetPreferenceRequest(string? Value);

/// <summary>
/// Lectura y escritura de preferencias. Para USAR una en el backend basta una línea: <c>await prefs.IntAsync(Prefs.X)</c>
/// (si no se pasa sucursal se usa la de la sesión).
/// </summary>
public interface IPreferenceService
{
    Task<bool> BoolAsync(PreferenceDef def, long? branchId = null, CancellationToken ct = default);
    Task<int> IntAsync(PreferenceDef def, long? branchId = null, CancellationToken ct = default);
    Task<string> TextAsync(PreferenceDef def, long? branchId = null, CancellationToken ct = default);

    /// <summary>Todo lo que la app necesita de golpe: las del usuario + las de su sucursal + las de la empresa, ya resueltas.</summary>
    Task<IReadOnlyDictionary<string, string>> EffectiveAsync(long? branchId = null, CancellationToken ct = default);
    Task<PreferenceSectionResponse> ListAsync(PreferenceOwner level, long? branchId = null, CancellationToken ct = default);
    Task<PreferenceItemResponse> SetAsync(PreferenceOwner level, long? branchId, string key, string? value, CancellationToken ct = default);
    Task ResetAsync(PreferenceOwner level, long? branchId, string key, CancellationToken ct = default);
}

public sealed class PreferenceService : IPreferenceService
{
    private sealed record Snapshot(Dictionary<string, string> User, Dictionary<string, string> Branch, Dictionary<string, string> Company);

    private readonly TenantDbContext _db;
    private readonly ICurrentUser _user;
    private readonly PreferenceRegistry _registry;
    private readonly IClock _clock;
    // Una sola consulta por petición y sucursal (servicio «scoped»); se invalida al escribir.
    private readonly Dictionary<long, Snapshot> _cache = [];

    public PreferenceService(TenantDbContext db, ICurrentUser user, PreferenceRegistry registry, IClock clock)
    {
        _db = db;
        _user = user;
        _registry = registry;
        _clock = clock;
    }

    private async Task<Snapshot> LoadAsync(long? branchId, CancellationToken ct)
    {
        long? branch = branchId ?? _user.BranchId;
        long cacheKey = branch ?? 0;
        if (_cache.TryGetValue(cacheKey, out Snapshot? hit)) return hit;

        long userId = _user.UserId ?? -1;
        List<PreferenceValue> rows = await _db.PreferenceValues.AsNoTracking()
            .Where(v => v.Owner == PreferenceOwner.Company
                        || (v.Owner == PreferenceOwner.User && v.OwnerId == userId)
                        || (branch != null && v.Owner == PreferenceOwner.Branch && v.OwnerId == branch))
            .ToListAsync(ct);
        var snap = new Snapshot(
            rows.Where(r => r.Owner == PreferenceOwner.User).ToDictionary(r => r.Key, r => r.Value),
            rows.Where(r => r.Owner == PreferenceOwner.Branch).ToDictionary(r => r.Key, r => r.Value),
            rows.Where(r => r.Owner == PreferenceOwner.Company).ToDictionary(r => r.Key, r => r.Value));
        _cache[cacheKey] = snap;
        return snap;
    }

    private static bool Valid(PreferenceDef d, string v, out string clean)
    {
        try
        {
            clean = d.NormalizeLenient(v);
            return true;
        }
        catch (ArgumentException)
        {
            clean = "";
            return false;
        }
    }

    /// <summary>Herencia: persona → su valor; sucursal → sucursal, luego empresa; empresa → empresa; si no, el predeterminado.</summary>
    private static (string Value, string Source) Resolve(PreferenceDef d, Snapshot s)
    {
        switch (d.Scope)
        {
            case PrefScope.User:
                if (s.User.TryGetValue(d.Key, out string? u) && Valid(d, u, out string uc)) return (uc, "own");
                break;
            case PrefScope.Branch:
                if (s.Branch.TryGetValue(d.Key, out string? b) && Valid(d, b, out string bc)) return (bc, "own");
                if (s.Company.TryGetValue(d.Key, out string? c) && Valid(d, c, out string cc)) return (cc, "company");
                break;
            default:
                if (s.Company.TryGetValue(d.Key, out string? k) && Valid(d, k, out string kc)) return (kc, "own");
                break;
        }
        return (d.Default, "default");
    }

    private async Task<string> ValueAsync(PreferenceDef d, long? branchId, CancellationToken ct) => Resolve(d, await LoadAsync(branchId, ct)).Value;

    public async Task<bool> BoolAsync(PreferenceDef def, long? branchId = null, CancellationToken ct = default) =>
        bool.Parse(await ValueAsync(def, branchId, ct));

    public async Task<int> IntAsync(PreferenceDef def, long? branchId = null, CancellationToken ct = default) =>
        int.Parse(await ValueAsync(def, branchId, ct), System.Globalization.CultureInfo.InvariantCulture);

    public Task<string> TextAsync(PreferenceDef def, long? branchId = null, CancellationToken ct = default) => ValueAsync(def, branchId, ct);

    public async Task<IReadOnlyDictionary<string, string>> EffectiveAsync(long? branchId = null, CancellationToken ct = default)
    {
        Snapshot s = await LoadAsync(branchId, ct);
        return _registry.All.ToDictionary(d => d.Key, d => Resolve(d, s).Value);
    }

    // ── Pantalla de preferencias ─────────────────────────────────────────────
    private static bool AppliesTo(PreferenceDef d, PreferenceOwner level) => level switch
    {
        PreferenceOwner.User => d.Scope == PrefScope.User,
        PreferenceOwner.Branch => d.Scope == PrefScope.Branch,
        _ => d.Scope is PrefScope.Branch or PrefScope.Company, // la empresa fija el valor «para todas las sucursales»
    };

    private static PreferenceItemResponse ToItem(PreferenceDef d, string value, string source) =>
        new(d.Key, d.Label, d.Description, d.Type.ToString(), d.Default, value, source,
            d.Type == PrefType.Int ? d.Min : null, d.Type == PrefType.Int && d.Max != int.MaxValue ? d.Max : null, d.Unit, d.Hint, d.Options);

    public async Task<PreferenceSectionResponse> ListAsync(PreferenceOwner level, long? branchId = null, CancellationToken ct = default)
    {
        long? branch = null;
        if (level == PreferenceOwner.Branch)
        {
            branch = branchId ?? throw new InvalidArgumentException("Falta la sucursal.");
            await EnsureBranchAsync(branch.Value, ct);
        }
        Snapshot s = await LoadAsync(branch ?? (level == PreferenceOwner.Company ? -1 : null), ct);

        List<PreferenceGroupResponse> groups = [.. _registry.All.Where(d => AppliesTo(d, level)).GroupBy(d => d.Group)
            .OrderBy(g => _registry.Groups[g.Key].Order)
            .Select(g => new PreferenceGroupResponse(g.Key, _registry.Groups[g.Key].Label, _registry.Groups[g.Key].Description,
                [.. g.Select(d =>
                {
                    // En el nivel «empresa» se muestra el valor de la empresa, no el de ninguna sucursal.
                    (string v, string src) = level == PreferenceOwner.Company && d.Scope == PrefScope.Branch
                        ? s.Company.TryGetValue(d.Key, out string? cv) && Valid(d, cv, out string cvc) ? (cvc, "own") : (d.Default, "default")
                        : Resolve(d, s);
                    return ToItem(d, v, src);
                })]))];
        return new PreferenceSectionResponse(groups);
    }

    // ── Escritura ────────────────────────────────────────────────────────────
    private long OwnerFor(PreferenceOwner level, long? branchId) => level switch
    {
        PreferenceOwner.User => _user.RequireUserId(),
        PreferenceOwner.Branch => branchId ?? throw new InvalidArgumentException("Falta la sucursal."),
        _ => 0,
    };

    private PreferenceDef Def(string key, PreferenceOwner level) =>
        _registry.ByKey.TryGetValue(key, out PreferenceDef? d) && AppliesTo(d, level) ? d : throw new NotFoundException("Preferencia no encontrada.");

    private async Task EnsureBranchAsync(long branchId, CancellationToken ct)
    {
        if (!await _db.Branches.AnyAsync(b => b.Id == branchId, ct)) throw new NotFoundException("Sucursal no encontrada.");
    }

    public async Task<PreferenceItemResponse> SetAsync(PreferenceOwner level, long? branchId, string key, string? value, CancellationToken ct = default)
    {
        PreferenceDef def = Def(key, level);
        string normalized;
        try
        {
            normalized = def.Normalize(value);
        }
        catch (ArgumentException ex)
        {
            throw new InvalidArgumentException(ex.Message);
        }
        long ownerId = OwnerFor(level, branchId);
        if (level == PreferenceOwner.Branch) await EnsureBranchAsync(ownerId, ct);

        PreferenceValue? row = await _db.PreferenceValues.FirstOrDefaultAsync(v => v.Owner == level && v.OwnerId == ownerId && v.Key == key, ct);
        if (row is null)
            _db.PreferenceValues.Add(new PreferenceValue
            {
                Owner = level, OwnerId = ownerId, Key = key, Value = normalized, UpdatedAt = _clock.Now, UpdatedBy = _user.UserId,
            });
        else
        {
            row.Value = normalized;
            row.UpdatedAt = _clock.Now;
            row.UpdatedBy = _user.UserId;
        }
        await _db.SaveChangesAsync(ct);
        _cache.Clear();
        return (await ListAsync(level, branchId, ct)).Groups.SelectMany(g => g.Items).First(i => i.Key == def.Key);
    }

    public async Task ResetAsync(PreferenceOwner level, long? branchId, string key, CancellationToken ct = default)
    {
        Def(key, level);
        long ownerId = OwnerFor(level, branchId);
        PreferenceValue? row = await _db.PreferenceValues.FirstOrDefaultAsync(v => v.Owner == level && v.OwnerId == ownerId && v.Key == key, ct);
        if (row is null) return;
        _db.PreferenceValues.Remove(row);
        await _db.SaveChangesAsync(ct);
        _cache.Clear();
    }
}

public static class PreferencesEndpoints
{
    public static IServiceCollection AddPreferences(this IServiceCollection services)
    {
        services.AddSingleton<PreferenceRegistry>();
        services.AddScoped<IPreferenceService, PreferenceService>();
        return services;
    }

    /// <summary>
    /// /api/preferences/me (cada persona) · /api/preferences/effective (todo resuelto para la app) ·
    /// /api/preferences/company (ADMIN) · /api/branches/{id}/preferences (ADMIN, MANAGER).
    /// </summary>
    public static void MapPreferencesEndpoints(this WebApplication app)
    {
        // Valida el catálogo al arrancar: una preferencia mal declarada impide levantar la API.
        _ = app.Services.GetRequiredService<PreferenceRegistry>();

        var me = app.MapGroup("/api/preferences/me").WithTags("Preferences");
        me.MapGet("/", async (IPreferenceService s, CancellationToken ct) => Results.Ok(await s.ListAsync(PreferenceOwner.User, null, ct)));
        me.MapPut("/{key}", async (string key, SetPreferenceRequest r, IPreferenceService s, CancellationToken ct) =>
            Results.Ok(await s.SetAsync(PreferenceOwner.User, null, key, r.Value, ct)));
        me.MapDelete("/{key}", async (string key, IPreferenceService s, CancellationToken ct) =>
        {
            await s.ResetAsync(PreferenceOwner.User, null, key, ct);
            return Results.NoContent();
        });

        app.MapGet("/api/preferences/effective", async (IPreferenceService s, CancellationToken ct, long? branchId = null) =>
            Results.Ok(await s.EffectiveAsync(branchId, ct))).WithTags("Preferences");

        var company = app.MapGroup("/api/preferences/company").WithTags("Preferences").RequireRoles(ROLE_ADMIN);
        company.MapGet("/", async (IPreferenceService s, CancellationToken ct) => Results.Ok(await s.ListAsync(PreferenceOwner.Company, null, ct)));
        company.MapPut("/{key}", async (string key, SetPreferenceRequest r, IPreferenceService s, CancellationToken ct) =>
            Results.Ok(await s.SetAsync(PreferenceOwner.Company, null, key, r.Value, ct)));
        company.MapDelete("/{key}", async (string key, IPreferenceService s, CancellationToken ct) =>
        {
            await s.ResetAsync(PreferenceOwner.Company, null, key, ct);
            return Results.NoContent();
        });

        var branch = app.MapGroup("/api/branches/{branchId:long}/preferences").WithTags("Preferences").RequireRoles(ROLE_ADMIN, ROLE_MANAGER);
        branch.MapGet("/", async (long branchId, IPreferenceService s, CancellationToken ct) =>
            Results.Ok(await s.ListAsync(PreferenceOwner.Branch, branchId, ct)));
        branch.MapPut("/{key}", async (long branchId, string key, SetPreferenceRequest r, IPreferenceService s, CancellationToken ct) =>
            Results.Ok(await s.SetAsync(PreferenceOwner.Branch, branchId, key, r.Value, ct)));
        branch.MapDelete("/{key}", async (long branchId, string key, IPreferenceService s, CancellationToken ct) =>
        {
            await s.ResetAsync(PreferenceOwner.Branch, branchId, key, ct);
            return Results.NoContent();
        });
    }
}
