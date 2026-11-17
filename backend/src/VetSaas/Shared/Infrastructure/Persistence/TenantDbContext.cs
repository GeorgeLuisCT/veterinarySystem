using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using VetSaas.Shared.Infrastructure.Tenancy;

namespace VetSaas.Shared.Infrastructure.Persistence;

/// <summary>
/// Datos de negocio de UNA empresa. El modelo no nombra ningún schema ni lleva columna de empresa:
/// cada conexión se abre apuntando al schema de la empresa de la petición (<see cref="TenantSchemaConnectionInterceptor"/>).
/// Los DbSet de cada módulo se declaran en su propio archivo parcial (Modules/*/Infrastructure/*DbSets.cs).
/// </summary>
public partial class TenantDbContext : DbContext
{
    private readonly ITenantContext _tenant;

    public TenantDbContext(DbContextOptions<TenantDbContext> options, ITenantContext tenant) : base(options)
    {
        _tenant = tenant;
    }

    /// <summary>Schema de la empresa actual; lanza si la petición no tiene empresa resuelta.</summary>
    public string TenantSchemaName => _tenant.Schema;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TenantDbContext).Assembly,
            type => type.Namespace is not null && type.Namespace.StartsWith("VetSaas.Modules.", StringComparison.Ordinal)
                    && !type.Namespace.StartsWith("VetSaas.Modules.Platform", StringComparison.Ordinal));

        // Como en el backend anterior, borrar un registro referenciado falla en la base en vez de arrastrar a otros.
        // Las composiciones (padre dueño de sus hijos) se declaran como Cascade en la configuración de cada módulo
        // y esas se respetan; las tablas puente de los muchos-a-muchos también conservan su cascada.
        foreach (IMutableForeignKey foreignKey in modelBuilder.Model.GetEntityTypes()
                     .Where(entityType => !entityType.IsPropertyBag)
                     .SelectMany(entityType => entityType.GetForeignKeys()))
        {
            if (((IConventionForeignKey)foreignKey).GetDeleteBehaviorConfigurationSource() != ConfigurationSource.Explicit)
                foreignKey.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Fechas y horas «de pared» de la clínica (sin zona), igual que las ve el usuario.
        configurationBuilder.Properties<DateTime>().HaveColumnType("timestamp without time zone");
        configurationBuilder.Properties<decimal>().HavePrecision(19, 2);
        configurationBuilder.Properties<Enum>().HaveConversion<string>().HaveMaxLength(60);
    }
}
