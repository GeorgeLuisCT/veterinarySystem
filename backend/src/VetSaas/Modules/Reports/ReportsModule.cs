using System.Globalization;
using HotChocolate;
using HotChocolate.AspNetCore;
using HotChocolate.Execution;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Reports;

public interface IReportsService
{
    Task<ReportsDashboard> DashboardAsync(ReportFiltersInput? input, CancellationToken ct);
    Task<ReportCollection> CollectionAsync(ReportModule module, ReportFiltersInput? input, CancellationToken ct);
}

/// <summary>Arma el tablero con los proveedores de cada módulo, en el orden del enum (como ReportsAggregationService).</summary>
public sealed class ReportsService : IReportsService
{
    private readonly IReadOnlyList<IReportDataProvider> _providers;
    private readonly IClock _clock;

    public ReportsService(IEnumerable<IReportDataProvider> providers, IClock clock)
    {
        _providers = providers.OrderBy(p => p.Module).ToList();
        _clock = clock;
    }

    public async Task<ReportsDashboard> DashboardAsync(ReportFiltersInput? input, CancellationToken ct)
    {
        ReportFilters filters = ReportFilters.FromInput(input, _clock.Now);
        var collections = new List<ReportCollection>();
        // Secuencial: todos los proveedores comparten la conexión del DbContext del tenant.
        foreach (IReportDataProvider provider in _providers.Where(p => filters.Includes(p.Module)))
            collections.Add(await provider.BuildAsync(filters, ct));

        return new ReportsDashboard { GeneratedAt = GeneratedAt(), Filters = filters.ToState(), Collections = collections };
    }

    public Task<ReportCollection> CollectionAsync(ReportModule module, ReportFiltersInput? input, CancellationToken ct)
    {
        IReportDataProvider provider = _providers.FirstOrDefault(p => p.Module == module)
            ?? throw new InvalidArgumentException("No existe un proveedor para " + module);
        return provider.BuildAsync(ReportFilters.FromInput(input, _clock.Now), ct);
    }

    /// <summary>Como OffsetDateTime.now().toString() de Java: hora local con su desfase.</summary>
    private string GeneratedAt()
    {
        DateTime local = _clock.Now;
        TimeSpan offset = local - DateTime.SpecifyKind(_clock.UtcNow, DateTimeKind.Unspecified);
        offset = TimeSpan.FromMinutes(Math.Round(offset.TotalMinutes / 15) * 15);
        return new DateTimeOffset(local, offset).ToString("yyyy-MM-dd'T'HH:mm:ss.ffffffzzz", CultureInfo.InvariantCulture);
    }
}

/// <summary>Raíz GraphQL: reportsDashboard(filters) y reportCollection(module, filters).</summary>
public sealed class ReportsQuery
{
    public Task<ReportsDashboard> GetReportsDashboard(ReportFiltersInput? filters, [Service] IReportsService reports, CancellationToken ct) =>
        reports.DashboardAsync(filters, ct);

    public Task<ReportCollection> GetReportCollection(ReportModule module, ReportFiltersInput? filters, [Service] IReportsService reports,
        CancellationToken ct) => reports.CollectionAsync(module, filters, ct);
}

/// <summary>Expone el mensaje de las excepciones de negocio; el resto queda como error genérico.</summary>
public sealed class ReportsErrorFilter : IErrorFilter
{
    public IError OnError(IError error) =>
        error.Exception is ApiException api ? error.WithMessage(api.Message).RemoveException() : error;
}

public static class ReportsModule
{
    public const string Path = "/api/reports/graphql";

    public static IServiceCollection AddReports(this IServiceCollection services)
    {
        services.AddScoped<ReportDb>();
        services.AddScoped<IReportDataProvider, SalesReportProvider>();
        services.AddScoped<IReportDataProvider, InventoryReportProvider>();
        services.AddScoped<IReportDataProvider, FinanceReportProvider>();
        services.AddScoped<IReportDataProvider, ClinicReportProvider>();
        services.AddScoped<IReportDataProvider, FieldworkReportProvider>();
        services.AddScoped<IReportDataProvider, CashboxReportProvider>();
        services.AddScoped<IReportDataProvider, CustomersReportProvider>();
        services.AddScoped<IReportDataProvider, AnimalsReportProvider>();
        services.AddScoped<IReportDataProvider, EmployeesReportProvider>();
        services.AddScoped<IReportDataProvider, BranchesReportProvider>();
        services.AddScoped<IReportDataProvider, UsersReportProvider>();
        services.AddScoped<IReportDataProvider, PublicPortalReportProvider>();
        services.AddScoped<IReportsService, ReportsService>();

        services.AddGraphQLServer()
            .AddQueryType<ReportsQuery>()
            .AddErrorFilter<ReportsErrorFilter>()
            // Los resolvers comparten el DbContext del tenant: nunca en paralelo.
            .ModifyOptions(o => o.DefaultResolverStrategy = HotChocolate.Execution.ExecutionStrategy.Serial);
        return services;
    }

    /// <summary>Solo POST (como Spring GraphQL); sin IDE embebido. Roles ADMIN/MANAGER vía AccessRules (/api/reports/**).</summary>
    public static void MapReportsEndpoints(this WebApplication app) =>
        app.MapGraphQL(Path).WithOptions(new GraphQLServerOptions
        {
            EnableGetRequests = false,
            EnableSchemaRequests = app.Environment.IsDevelopment(),
            Tool = { Enable = false },
        });
}
