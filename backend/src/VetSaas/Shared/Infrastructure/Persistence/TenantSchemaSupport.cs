using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Migrations.Internal;
using VetSaas.Shared.Infrastructure.Tenancy;

namespace VetSaas.Shared.Infrastructure.Persistence;

/// <summary>
/// Dirige cada conexión de negocio al schema de la empresa: al abrirla fija el search_path.
/// El modelo de EF no nombra ningún schema, así que la misma consulta sirve para todas las empresas
/// y es PostgreSQL quien resuelve las tablas dentro del schema de la empresa actual.
/// «public» queda detrás solo para extensiones; las tablas de plataforma están en otro schema y no son alcanzables.
/// </summary>
public sealed class TenantSchemaConnectionInterceptor : DbConnectionInterceptor
{
    private static string Sql(DbContext? context) =>
        context is TenantDbContext tenantContext
            ? $"SET search_path TO \"{tenantContext.TenantSchemaName}\", public"
            : throw new InvalidOperationException("El interceptor de schema solo se usa con TenantDbContext.");

    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        using DbCommand command = connection.CreateCommand();
        command.CommandText = Sql(eventData.Context);
        command.ExecuteNonQuery();
    }

    public override async Task ConnectionOpenedAsync(DbConnection connection, ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = Sql(eventData.Context);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}

/// <summary>
/// Cada empresa lleva su propio historial de migraciones dentro de su schema. Sin esto EF buscaría la tabla
/// del historial en «public» y volvería a aplicar todas las migraciones a cada empresa.
/// </summary>
public sealed class TenantHistoryRepository : NpgsqlHistoryRepository
{
    public TenantHistoryRepository(HistoryRepositoryDependencies dependencies) : base(dependencies) { }

    protected override string? TableSchema =>
        ((TenantDbContext)Dependencies.CurrentContext.Context).TenantSchemaName;
}

/// <summary>Solo para «dotnet ef migrations add»: el modelo no depende del schema, así que basta uno ficticio.</summary>
public sealed class TenantDbContextDesignFactory : IDesignTimeDbContextFactory<TenantDbContext>
{
    public TenantDbContext CreateDbContext(string[] args)
    {
        var tenant = new TenantContext();
        tenant.Use(new TenantInfo(Guid.Empty, "design", "Design", TenantSchema.FromSlug("design"), TenantStatus.ACTIVE));
        var options = new DbContextOptionsBuilder<TenantDbContext>();
        PersistenceSetup.ConfigureTenant(options,
            Environment.GetEnvironmentVariable("ConnectionStrings__Default") ?? "Host=localhost;Database=design");
        return new TenantDbContext(options.Options, tenant);
    }
}

public sealed class PlatformDbContextDesignFactory : IDesignTimeDbContextFactory<PlatformDbContext>
{
    public PlatformDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<PlatformDbContext>();
        PersistenceSetup.ConfigurePlatform(options,
            Environment.GetEnvironmentVariable("ConnectionStrings__Default") ?? "Host=localhost;Database=design");
        return new PlatformDbContext(options.Options);
    }
}

public static class PersistenceSetup
{
    public const string HistoryTable = "__ef_migrations_history";

    private static readonly TenantSchemaConnectionInterceptor SchemaInterceptor = new();

    public static void ConfigureTenant(DbContextOptionsBuilder options, string connectionString)
    {
        options.UseNpgsql(connectionString, npgsql => npgsql.MigrationsHistoryTable(HistoryTable))
            .UseSnakeCaseNamingConvention()
            .ReplaceService<IHistoryRepository, TenantHistoryRepository>()
            .AddInterceptors(SchemaInterceptor);
    }

    public static void ConfigurePlatform(DbContextOptionsBuilder options, string connectionString)
    {
        options.UseNpgsql(connectionString,
                npgsql => npgsql.MigrationsHistoryTable(HistoryTable, PlatformDbContext.Schema))
            .UseSnakeCaseNamingConvention();
    }
}
