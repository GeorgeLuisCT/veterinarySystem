using System.Text.RegularExpressions;

namespace VetSaas.Shared.Infrastructure.Tenancy;

public enum TenantStatus
{
    /// <summary>Se está creando su schema; todavía no admite sesiones.</summary>
    PROVISIONING,
    ACTIVE,
    /// <summary>Suspendida por la plataforma: nadie de la empresa puede entrar.</summary>
    SUSPENDED
}

/// <summary>Empresa (tenant) ya resuelta: su identificador público (slug) y el schema de PostgreSQL donde viven sus datos.</summary>
public sealed record TenantInfo(Guid Id, string Slug, string Name, string Schema, TenantStatus Status);

/// <summary>
/// Empresa de la petición en curso. Los datos de negocio NO llevan columna de empresa: el aislamiento es el schema,
/// así que sin empresa resuelta no se puede abrir una conexión de negocio (ver <see cref="Schema"/>).
/// </summary>
public interface ITenantContext
{
    TenantInfo? Current { get; }
    bool HasTenant { get; }
    /// <summary>Schema de la empresa actual. Lanza si no hay empresa: nunca se cae por omisión en otro schema.</summary>
    string Schema { get; }
    void Use(TenantInfo tenant);
}

public sealed class TenantContext : ITenantContext
{
    public TenantInfo? Current { get; private set; }
    public bool HasTenant => Current is not null;

    public string Schema => Current?.Schema
        ?? throw new InvalidOperationException("No hay una empresa resuelta para esta operación; no se puede acceder a datos de negocio.");

    public void Use(TenantInfo tenant)
    {
        TenantSchema.EnsureValid(tenant.Schema);
        Current = tenant;
    }
}

public static partial class TenantSchema
{
    public const string Prefix = "t_";

    [GeneratedRegex("^[a-z][a-z0-9_]{0,62}$")]
    private static partial Regex ValidName();

    [GeneratedRegex("^[a-z][a-z0-9-]{1,38}[a-z0-9]$")]
    private static partial Regex ValidSlug();

    /// <summary>El nombre del schema se concatena en SQL (SET search_path / CREATE SCHEMA): solo se aceptan identificadores simples.</summary>
    public static void EnsureValid(string schema)
    {
        if (!ValidName().IsMatch(schema) || !schema.StartsWith(Prefix, StringComparison.Ordinal))
            throw new InvalidOperationException($"Nombre de schema de empresa inválido: '{schema}'.");
    }

    public static bool IsValidSlug(string slug) => ValidSlug().IsMatch(slug);

    /// <summary>Schema de una empresa a partir de su slug: «mi-clinica» → «t_mi_clinica».</summary>
    public static string FromSlug(string slug) => Prefix + slug.Replace('-', '_');
}
