using System.Collections.Concurrent;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata;
using Npgsql;
using VetSaas.Modules.Catalogs;
using VetSaas.Shared.Application;

namespace VetSaas.Shared.Infrastructure.Persistence;

/// <summary>
/// Catálogos editables dentro del schema de la empresa:
/// <list type="bullet">
/// <item>cada catálogo nace con sus valores por defecto la primera vez que la empresa lo usa (también en empresas ya existentes);</item>
/// <item>al guardar, toda propiedad marcada con <see cref="CatalogAttribute"/> debe tener un valor existente y activo de su catálogo.</item>
/// </list>
/// </summary>
public partial class TenantDbContext
{
    /// <summary>Schemas cuyos catálogos ya se comprobaron en esta instancia (evita repetir la consulta en cada petición).</summary>
    private static readonly ConcurrentDictionary<string, byte> SeededSchemas = new();

    /// <summary>Propiedades con catálogo de cada tipo de entidad (se calcula una vez por tipo).</summary>
    private static readonly ConcurrentDictionary<Type, (string Property, string Key)[]> CatalogProperties = new();

    private static (string Property, string Key)[] CatalogPropertiesOf(Type type) =>
        CatalogProperties.GetOrAdd(type, t => t.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(p => (p.Name, Attr: p.GetCustomAttribute<CatalogAttribute>()))
            .Where(x => x.Attr is not null)
            .Select(x => (x.Name, x.Attr!.Key)).ToArray());

    /// <summary>Crea los valores por defecto de los catálogos que aún no tienen ninguno (los ya editados no se tocan).</summary>
    public async Task EnsureCatalogsSeededAsync(CancellationToken ct = default)
    {
        string schema = TenantSchemaName;
        if (SeededSchemas.ContainsKey(schema)) return;

        var existing = (await CatalogItems.AsNoTracking().Select(i => i.Catalog).Distinct().ToListAsync(ct)).ToHashSet();
        foreach (CatalogDefinition def in CatalogKeys.All.Where(d => !existing.Contains(d.Key)))
        {
            await Database.ExecuteSqlRawAsync("""
                INSERT INTO catalog_items (catalog, code, label, plural_label, abbreviation, sort_order, active, created_at, updated_at)
                SELECT @key, t.code, t.label, t.plural, t.abbr, t.ord, true, now()::timestamp, now()::timestamp
                FROM unnest(@codes, @labels, @plurals, @abbrs, @orders) AS t(code, label, plural, abbr, ord)
                ON CONFLICT (catalog, code) DO NOTHING
                """,
                new object[]
                {
                    new NpgsqlParameter("key", def.Key),
                    new NpgsqlParameter("codes", def.Defaults.Select(s => s.Code).ToArray()),
                    new NpgsqlParameter("labels", def.Defaults.Select(s => s.Label).ToArray()),
                    new NpgsqlParameter("plurals", def.Defaults.Select(s => s.PluralLabel).ToArray()),
                    new NpgsqlParameter("abbrs", def.Defaults.Select(s => s.Abbreviation).ToArray()),
                    new NpgsqlParameter("orders", def.Defaults.Select((_, i) => (i + 1) * 10).ToArray()),
                }, ct);
        }
        SeededSchemas.TryAdd(schema, 0);
    }

    /// <summary>Texto de cada código de un catálogo (incluye los desactivados, para mostrar datos antiguos).</summary>
    public async Task<Dictionary<string, string>> CatalogLabelsAsync(string key, CancellationToken ct = default)
    {
        await EnsureCatalogsSeededAsync(ct);
        return await CatalogItems.AsNoTracking().Where(i => i.Catalog == key).ToDictionaryAsync(i => i.Code, i => i.Label, ct);
    }

    /// <summary>¿Algún registro usa este código? Recorre todas las columnas marcadas con ese catálogo.</summary>
    public async Task<bool> IsCatalogCodeInUseAsync(string key, string code, CancellationToken ct = default)
    {
        foreach (IEntityType entity in Model.GetEntityTypes().Where(e => e.ClrType is not null && !e.IsOwned()))
        {
            string? table = entity.GetTableName();
            if (table is null) continue;
            var store = StoreObjectIdentifier.Table(table, entity.GetSchema());
            foreach ((string property, string catalog) in CatalogPropertiesOf(entity.ClrType))
            {
                if (catalog != key) continue;
                string? column = entity.FindProperty(property)?.GetColumnName(store);
                if (column is null) continue;
                // Nombres de tabla y columna salen del modelo (no del usuario); el valor va como parámetro.
                bool used = await Database.SqlQueryRaw<bool>(
                        $"SELECT EXISTS (SELECT 1 FROM \"{table}\" WHERE \"{column}\" = @code) AS \"Value\"", new NpgsqlParameter("code", code))
                    .SingleAsync(ct);
                if (used) return true;
            }
        }
        return false;
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ValidateCatalogValuesAsync(CancellationToken.None).GetAwaiter().GetResult();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        await ValidateCatalogValuesAsync(cancellationToken);
        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    /// <summary>Valores nuevos o cambiados de propiedades con catálogo: deben existir y estar activos.</summary>
    private async Task ValidateCatalogValuesAsync(CancellationToken ct)
    {
        ChangeTracker.DetectChanges();
        var pending = new HashSet<(string Key, string Code)>();
        foreach (EntityEntry entry in ChangeTracker.Entries().Where(e => e.State is EntityState.Added or EntityState.Modified))
        {
            foreach ((string property, string key) in CatalogPropertiesOf(entry.Entity.GetType()))
            {
                PropertyEntry prop = entry.Property(property);
                if (prop.CurrentValue is not string code || string.IsNullOrWhiteSpace(code)) continue;
                if (entry.State == EntityState.Modified && (!prop.IsModified || Equals(prop.OriginalValue, prop.CurrentValue))) continue;
                pending.Add((key, code));
            }
        }
        if (pending.Count == 0) return;

        await EnsureCatalogsSeededAsync(ct);
        string[] keys = pending.Select(p => p.Key).Distinct().ToArray();
        string[] codes = pending.Select(p => p.Code).Distinct().ToArray();
        var valid = (await CatalogItems.AsNoTracking()
                .Where(i => i.Active && keys.Contains(i.Catalog) && codes.Contains(i.Code))
                .Select(i => new { i.Catalog, i.Code }).ToListAsync(ct))
            .Select(i => (i.Catalog, i.Code)).ToHashSet();

        foreach ((string key, string code) in pending)
        {
            if (valid.Contains((key, code))) continue;
            string title = CatalogKeys.ByKey.TryGetValue(key, out CatalogDefinition? d) ? d.Title : key;
            throw new InvalidArgumentException($"«{code}» no es un valor válido (o está desactivado) en «{title}».");
        }
    }
}
