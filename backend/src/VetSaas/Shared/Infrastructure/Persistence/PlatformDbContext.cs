using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Platform.Domain;

namespace VetSaas.Shared.Infrastructure.Persistence;

/// <summary>
/// Datos globales de la plataforma (empresas y superadmins), en el schema «platform».
/// Aquí no hay datos de negocio: esos viven en el schema de cada empresa (<see cref="TenantDbContext"/>).
/// </summary>
public class PlatformDbContext : DbContext
{
    public const string Schema = "platform";

    public PlatformDbContext(DbContextOptions<PlatformDbContext> options) : base(options) { }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<PlatformAdmin> Admins => Set<PlatformAdmin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasIndex(t => t.Slug).IsUnique();
            e.HasIndex(t => t.SchemaName).IsUnique();
            e.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<PlatformAdmin>(e => e.HasIndex(a => a.Email).IsUnique());
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTime>().HaveColumnType("timestamp without time zone");
    }
}
