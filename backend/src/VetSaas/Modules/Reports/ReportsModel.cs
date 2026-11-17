using System.Globalization;
using HotChocolate;
using HotChocolate.Types;

namespace VetSaas.Modules.Reports;

// Tipos GraphQL equivalentes a resources/graphql/reporting.graphqls del backend Java.

public enum ReportModule
{
    SALES, INVENTORY, FINANCE, CLINIC, FIELDWORK, CASHBOX, CUSTOMERS, ANIMALS, EMPLOYEES, BRANCHES, USERS, PUBLIC_PORTAL,
}

public sealed class ReportFiltersInput
{
    public string? From { get; set; }
    public string? To { get; set; }
    [GraphQLType(typeof(ListType<NonNullType<IdType>>))] public List<string>? BranchIds { get; set; }
    [GraphQLType(typeof(ListType<NonNullType<IdType>>))] public List<string>? EmployeeIds { get; set; }
    [GraphQLType(typeof(ListType<NonNullType<IdType>>))] public List<string>? CustomerIds { get; set; }
    [GraphQLType(typeof(ListType<NonNullType<IdType>>))] public List<string>? AnimalIds { get; set; }
    [GraphQLType(typeof(ListType<NonNullType<IdType>>))] public List<string>? ZoneIds { get; set; }
    public List<string>? Statuses { get; set; }
    public List<string>? Species { get; set; }
    public List<ReportModule>? Modules { get; set; }
    public bool? IncludeVoided { get; set; }
    public string? Search { get; set; }
}

public sealed class ReportFilterState
{
    public string? From { get; init; }
    public string? To { get; init; }
    [GraphQLType(typeof(ListType<NonNullType<IdType>>))] public List<string> BranchIds { get; init; } = new();
    [GraphQLType(typeof(ListType<NonNullType<IdType>>))] public List<string> EmployeeIds { get; init; } = new();
    [GraphQLType(typeof(ListType<NonNullType<IdType>>))] public List<string> CustomerIds { get; init; } = new();
    [GraphQLType(typeof(ListType<NonNullType<IdType>>))] public List<string> AnimalIds { get; init; } = new();
    [GraphQLType(typeof(ListType<NonNullType<IdType>>))] public List<string> ZoneIds { get; init; } = new();
    public List<string>? Statuses { get; init; }
    public List<string>? Species { get; init; }
    public List<ReportModule>? Modules { get; init; }
    public bool? IncludeVoided { get; init; }
    public string? Search { get; init; }
}

public sealed class ReportMetric
{
    public string Key { get; init; } = null!;
    public string Label { get; init; } = null!;
    public double? Value { get; init; }
    public string? FormattedValue { get; init; }
    public string? Unit { get; init; }
    public double? Trend { get; init; }
    public string? TrendLabel { get; init; }
}

[GraphQLName("KeyValuePair")]
public sealed record ReportKeyValue(string Key, string Value);

public sealed class ReportBreakdownItem
{
    public string Key { get; init; } = null!;
    public string Label { get; init; } = null!;
    public double? Value { get; init; }
    public string? FormattedValue { get; init; }
    public string? Unit { get; init; }
    public double? Percentage { get; init; }
    public double? Trend { get; init; }
    public List<ReportKeyValue> Metadata { get; init; } = new();
}

public sealed class ReportBreakdownGroup
{
    public string Key { get; init; } = null!;
    public string Title { get; init; } = null!;
    public string? Subtitle { get; init; }
    public List<ReportBreakdownItem> Items { get; init; } = new();
}

public sealed record ReportSeriesPoint(string Key, string Label, double Value);

public sealed class ReportCollection
{
    public ReportModule Module { get; init; }
    public string Title { get; init; } = null!;
    public string? Description { get; init; }
    public List<ReportMetric> Metrics { get; init; } = new();
    public List<ReportBreakdownGroup> Breakdowns { get; init; } = new();
    public List<ReportSeriesPoint> Timeline { get; init; } = new();
}

public sealed class ReportsDashboard
{
    public string GeneratedAt { get; init; } = null!;
    public ReportFilterState Filters { get; init; } = null!;
    public List<ReportCollection> Collections { get; init; } = new();
}

/// <summary>Filtros normalizados (equivalente a ReportFilters de Java).</summary>
public sealed class ReportFilters
{
    public DateTime From { get; private init; }
    public DateTime To { get; private init; }
    public long[] BranchIds { get; private init; } = Array.Empty<long>();
    public long[] EmployeeIds { get; private init; } = Array.Empty<long>();
    public long[] CustomerIds { get; private init; } = Array.Empty<long>();
    public long[] AnimalIds { get; private init; } = Array.Empty<long>();
    public long[] ZoneIds { get; private init; } = Array.Empty<long>();
    public string[] Statuses { get; private init; } = Array.Empty<string>();
    public string[] Species { get; private init; } = Array.Empty<string>();
    public IReadOnlyCollection<ReportModule> Modules { get; private init; } = Enum.GetValues<ReportModule>();
    public bool IncludeVoided { get; private init; }
    public string? Search { get; private init; }

    public bool Includes(ReportModule module) => Modules.Count == 0 || Modules.Contains(module);

    public static ReportFilters FromInput(ReportFiltersInput? input, DateTime now)
    {
        DateTime to = ParseDateTime(input?.To) ?? now;
        DateTime from = ParseDateTime(input?.From) ?? to.AddDays(-30);
        if (from > to) (from, to) = (to, from);
        return new ReportFilters
        {
            From = from.Date,
            To = to.Date.AddHours(23).AddMinutes(59).AddSeconds(59).AddMilliseconds(999),
            BranchIds = ToIds(input?.BranchIds),
            EmployeeIds = ToIds(input?.EmployeeIds),
            CustomerIds = ToIds(input?.CustomerIds),
            AnimalIds = ToIds(input?.AnimalIds),
            ZoneIds = ToIds(input?.ZoneIds),
            Statuses = ToUpper(input?.Statuses),
            Species = ToUpper(input?.Species),
            Modules = input?.Modules is { Count: > 0 } m ? m.Distinct().OrderBy(x => x).ToArray() : Enum.GetValues<ReportModule>(),
            IncludeVoided = input?.IncludeVoided == true,
            Search = string.IsNullOrWhiteSpace(input?.Search) ? null : input!.Search!.Trim(),
        };
    }

    public ReportFilterState ToState() => new()
    {
        From = JavaLocalDateTime(From),
        To = JavaLocalDateTime(To),
        BranchIds = BranchIds.Select(i => i.ToString(CultureInfo.InvariantCulture)).ToList(),
        EmployeeIds = EmployeeIds.Select(i => i.ToString(CultureInfo.InvariantCulture)).ToList(),
        CustomerIds = CustomerIds.Select(i => i.ToString(CultureInfo.InvariantCulture)).ToList(),
        AnimalIds = AnimalIds.Select(i => i.ToString(CultureInfo.InvariantCulture)).ToList(),
        ZoneIds = ZoneIds.Select(i => i.ToString(CultureInfo.InvariantCulture)).ToList(),
        Statuses = Statuses.ToList(),
        Species = Species.ToList(),
        Modules = Modules.ToList(),
        IncludeVoided = IncludeVoided,
        Search = Search,
    };

    private static long[] ToIds(List<string>? values) => values is null
        ? Array.Empty<long>()
        : values.Select(v => long.TryParse(v, NumberStyles.Integer, CultureInfo.InvariantCulture, out long id) ? (long?)id : null)
            .Where(v => v is not null).Select(v => v!.Value).Distinct().ToArray();

    private static string[] ToUpper(List<string>? values) => values is null
        ? Array.Empty<string>()
        : values.Where(v => v is not null).Select(v => v.Trim()).Where(v => v.Length > 0)
            .Select(v => v.ToUpperInvariant().Replace(' ', '_')).Distinct().ToArray();

    /// <summary>Igual que Java: con zona se toma la hora local indicada (sin convertir), luego fecha-hora local y por último solo fecha.</summary>
    private static DateTime? ParseDateTime(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        string v = value.Trim();
        bool hasOffset = v.EndsWith('Z') || v.EndsWith('z') || System.Text.RegularExpressions.Regex.IsMatch(v, @"T.*[+-]\d{2}:?\d{2}$");
        if (hasOffset && DateTimeOffset.TryParse(v, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dto))
            return DateTime.SpecifyKind(dto.DateTime, DateTimeKind.Unspecified);
        if (v.Contains('T') && DateTime.TryParse(v, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return DateTime.SpecifyKind(dt, DateTimeKind.Unspecified);
        if (DateOnly.TryParseExact(v, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
            return d.ToDateTime(TimeOnly.MinValue);
        return null;
    }

    /// <summary>Formato de LocalDateTime.toString() de Java (omite segundos/fracción en cero).</summary>
    public static string JavaLocalDateTime(DateTime v)
    {
        string s = v.ToString("yyyy-MM-dd'T'HH:mm", CultureInfo.InvariantCulture);
        long ticks = v.Ticks % TimeSpan.TicksPerSecond;
        if (v.Second == 0 && ticks == 0) return s;
        s += v.ToString(":ss", CultureInfo.InvariantCulture);
        if (ticks == 0) return s;
        string frac = (ticks * 100).ToString("D9", CultureInfo.InvariantCulture);
        return s + "." + (frac.EndsWith("000000") ? frac[..3] : frac.EndsWith("000") ? frac[..6] : frac);
    }
}

/// <summary>Formatos numéricos es-PE (como ReportNumberUtils de Java).</summary>
public static class ReportFormat
{
    private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

    public static string Currency(decimal value) =>
        (value < 0 ? "-" : "") + "S/ " + Math.Abs(Math.Round(value, 2, MidpointRounding.ToEven)).ToString("#,##0.00", Inv);

    public static string? Percentage(double? value) => value is null ? null : (value.Value * 100).ToString("#,##0.0", Inv) + " %";

    public static string F0(double v) => v.ToString("F0", Inv);
    public static string F1(double v) => v.ToString("F1", Inv);
    public static string F2(double v) => v.ToString("F2", Inv);
    public static string Int(int v) => v.ToString(Inv);
}
