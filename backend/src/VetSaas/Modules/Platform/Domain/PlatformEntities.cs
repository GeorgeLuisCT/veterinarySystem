using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VetSaas.Shared.Infrastructure.Tenancy;

namespace VetSaas.Modules.Platform.Domain;

/// <summary>Empresa cliente de la plataforma. Vive en el schema «platform»; sus datos de negocio, en su propio schema.</summary>
[Table("tenants")]
public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Identificador público con el que la empresa inicia sesión (minúsculas, números y guiones).</summary>
    [MaxLength(40)]
    public string Slug { get; set; } = null!;

    [MaxLength(160)]
    public string Name { get; set; } = null!;

    /// <summary>Schema de PostgreSQL con todos los datos de la empresa.</summary>
    [MaxLength(63)]
    public string SchemaName { get; set; } = null!;

    public TenantStatus Status { get; set; } = TenantStatus.PROVISIONING;

    public DateTime CreatedAt { get; set; }

    public TenantInfo ToInfo() => new(Id, Slug, Name, SchemaName, Status);
}

/// <summary>Usuario del panel de plataforma (superadmin). No pertenece a ninguna empresa.</summary>
[Table("platform_admins")]
public class PlatformAdmin
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(160)]
    public string Email { get; set; } = null!;

    [MaxLength(160)]
    public string Name { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
}
