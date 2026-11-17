using System.Data.Common;
using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using VetSaas.Shared.Infrastructure.Persistence;
using static VetSaas.Modules.Reports.ReportFormat;

namespace VetSaas.Modules.Reports;

// =====================================================================================================
// Infraestructura SQL: consultas crudas sobre el schema del tenant actual (search_path lo fija el interceptor
// al abrir la conexión vía EF), equivalentes a las de los providers JDBC del backend Java.
// =====================================================================================================

public sealed class ReportRow
{
    private readonly Dictionary<string, object?> _values;
    public ReportRow(Dictionary<string, object?> values) => _values = values;

    private object? Raw(string key) => _values.TryGetValue(key, out object? v) && v is not DBNull ? v : null;
    public double D(string key) => Raw(key) is { } v ? Convert.ToDouble(v, CultureInfo.InvariantCulture) : 0d;
    public decimal M(string key) => Raw(key) is { } v ? Convert.ToDecimal(v, CultureInfo.InvariantCulture) : 0m;
    public int I(string key) => Raw(key) is { } v ? Convert.ToInt32(v, CultureInfo.InvariantCulture) : 0;
    public string? S(string key) => Raw(key)?.ToString();
    public string DateKey(string key) => Raw(key) switch
    {
        DateTime dt => dt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        DateOnly d => d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        var other => other?.ToString() ?? "",
    };
}

/// <summary>Cláusula WHERE con parámetros nombrados (equivalente a ReportSqlHelper).</summary>
public sealed class SqlWhere
{
    private readonly StringBuilder _sql;
    public Dictionary<string, object> Params { get; } = new();

    public SqlWhere(string initial = " WHERE 1=1") => _sql = new StringBuilder(initial);

    public SqlWhere Raw(string fragment)
    {
        _sql.Append(fragment);
        return this;
    }

    public SqlWhere DateRange(string column, ReportFilters f, string fromParam, string toParam)
    {
        _sql.Append(" AND ").Append(column).Append(" >= @").Append(fromParam);
        Params[fromParam] = f.From;
        _sql.Append(" AND ").Append(column).Append(" <= @").Append(toParam);
        Params[toParam] = f.To;
        return this;
    }

    public SqlWhere Ids(string column, long[] ids, string name)
    {
        if (ids.Length == 0) return this;
        _sql.Append(" AND ").Append(column).Append(" = ANY(@").Append(name).Append(')');
        Params[name] = ids;
        return this;
    }

    public SqlWhere In(string column, string[] values, string name)
    {
        if (values.Length == 0) return this;
        _sql.Append(" AND ").Append(column).Append(" = ANY(@").Append(name).Append(')');
        Params[name] = values;
        return this;
    }

    public SqlWhere Search(string expression, string name, string? search)
    {
        if (string.IsNullOrWhiteSpace(search)) return this;
        _sql.Append(" AND (").Append(expression).Append(')');
        Params[name] = "%" + search.ToLowerInvariant() + "%";
        return this;
    }

    public override string ToString() => _sql.ToString();
}

public sealed class ReportDb
{
    private readonly TenantDbContext _db;
    public ReportDb(TenantDbContext db) => _db = db;

    public async Task<List<ReportRow>> QueryAsync(string sql, IReadOnlyDictionary<string, object>? parameters, CancellationToken ct)
    {
        await _db.Database.OpenConnectionAsync(ct);
        try
        {
            DbConnection conn = _db.Database.GetDbConnection();
            await using DbCommand cmd = conn.CreateCommand();
            cmd.CommandText = sql;
            cmd.Transaction = _db.Database.CurrentTransaction?.GetDbTransaction();
            foreach ((string name, object value) in parameters ?? new Dictionary<string, object>())
            {
                DbParameter p = cmd.CreateParameter();
                p.ParameterName = name;
                p.Value = value;
                cmd.Parameters.Add(p);
            }
            var rows = new List<ReportRow>();
            await using DbDataReader reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var values = new Dictionary<string, object?>(reader.FieldCount, StringComparer.OrdinalIgnoreCase);
                for (int i = 0; i < reader.FieldCount; i++) values[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                rows.Add(new ReportRow(values));
            }
            return rows;
        }
        finally
        {
            await _db.Database.CloseConnectionAsync();
        }
    }

    public Task<List<ReportRow>> QueryAsync(string sql, SqlWhere where, CancellationToken ct) => QueryAsync(sql, where.Params, ct);

    public async Task<ReportRow> OneAsync(string sql, IReadOnlyDictionary<string, object>? parameters, CancellationToken ct) =>
        (await QueryAsync(sql, parameters, ct)).FirstOrDefault() ?? new ReportRow(new Dictionary<string, object?>());

    public Task<ReportRow> OneAsync(string sql, SqlWhere where, CancellationToken ct) => OneAsync(sql, where.Params, ct);
}

public interface IReportDataProvider
{
    ReportModule Module { get; }
    Task<ReportCollection> BuildAsync(ReportFilters filters, CancellationToken ct);
}

public abstract class ReportProviderBase : IReportDataProvider
{
    protected ReportProviderBase(ReportDb db) => Db = db;
    protected ReportDb Db { get; }
    public abstract ReportModule Module { get; }
    public abstract Task<ReportCollection> BuildAsync(ReportFilters filters, CancellationToken ct);

    protected static ReportSeriesPoint Point(ReportRow r, string valueKey)
    {
        string key = r.DateKey("bucket_date");
        return new ReportSeriesPoint(key, key, r.D(valueKey));
    }

    /// <summary>Breakdown de conteo por columna (patrón "SELECT x, COUNT(*) AS qty ... GROUP BY x").</summary>
    protected static ReportBreakdownItem CountItem(ReportRow r, string labelKey)
    {
        string label = r.S(labelKey) ?? "";
        int qty = r.I("qty");
        return new ReportBreakdownItem { Key = label, Label = label, Value = qty, FormattedValue = Int(qty) };
    }

    protected static ReportMetric CountMetric(string key, string label, int value, string unit) =>
        new() { Key = key, Label = label, Value = value, FormattedValue = Int(value), Unit = unit };
}

// =====================================================================================================
// Ventas
// =====================================================================================================

public sealed class SalesReportProvider : ReportProviderBase
{
    public SalesReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.SALES;

    private const string From = """
         FROM sales s
         LEFT JOIN customer c ON c.id = s.customer_id
         LEFT JOIN users seller ON seller.id = s.seller_id
         LEFT JOIN employees emp ON emp.id = seller.employee_id
        """;

    private static SqlWhere Where(ReportFilters f)
    {
        var w = new SqlWhere().DateRange("s.created_at", f, "salesFrom", "salesTo");
        if (f.Statuses.Length == 0 && !f.IncludeVoided) w.Raw(" AND s.status <> 'VOIDED'");
        w.In("s.status", f.Statuses, "saleStatuses")
            .Ids("s.branch_id", f.BranchIds, "saleBranchIds")
            .Ids("seller.employee_id", f.EmployeeIds, "saleEmployeeIds")
            .Ids("s.customer_id", f.CustomerIds, "saleCustomerIds")
            .Search("LOWER(COALESCE(c.name,'')) LIKE @saleSearch OR LOWER(COALESCE(c.document_number,'')) LIKE @saleSearch " +
                    "OR LOWER(COALESCE(s.document_number,'')) LIKE @saleSearch", "saleSearch", f.Search);
        return w;
    }

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        var w = Where(f);
        ReportRow summary = await Db.OneAsync($"""
            SELECT
                COUNT(*) AS total_sales,
                SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_sales,
                SUM(CASE WHEN s.status = 'DRAFT' THEN 1 ELSE 0 END) AS draft_sales,
                SUM(CASE WHEN s.status = 'VOIDED' THEN 1 ELSE 0 END) AS voided_sales,
                COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.grand_total ELSE 0 END), 0) AS revenue,
                COALESCE(AVG(CASE WHEN s.status = 'COMPLETED' THEN s.grand_total END), 0) AS avg_ticket
            {From}{w}
            """, w, ct);

        double total = summary.D("total_sales"), completed = summary.D("completed_sales"), draft = summary.D("draft_sales"), voided = summary.D("voided_sales");
        decimal revenue = summary.M("revenue"), avgTicket = summary.M("avg_ticket");
        double completionRate = total == 0 ? 0 : completed / total;

        var topProducts = (await Db.QueryAsync($"""
            SELECT COALESCE(p.name, sd.item_description) AS label, SUM(sd.line_subtotal) AS amount, SUM(sd.quantity) AS quantity
            FROM sale_details sd
            JOIN sales s ON s.id = sd.sale_id
            LEFT JOIN products p ON p.id = sd.product_id
            LEFT JOIN customer c ON c.id = s.customer_id
            LEFT JOIN users seller ON seller.id = s.seller_id
            LEFT JOIN employees emp ON emp.id = seller.employee_id
            {w} AND s.status = 'COMPLETED'
            GROUP BY label ORDER BY amount DESC LIMIT 5
            """, w, ct)).Select(r => new ReportBreakdownItem
        {
            Key = r.S("label")!, Label = r.S("label")!, Value = r.D("amount"), FormattedValue = Currency(r.M("amount")),
            Metadata = { new ReportKeyValue("Cantidad", F2(r.D("quantity")) + " und.") },
        }).ToList();

        var topCustomers = (await Db.QueryAsync($"""
            SELECT COALESCE(c.name, 'Cliente mostrador') AS label, COUNT(s.id) AS operations, SUM(s.grand_total) AS amount
            {From}{w} AND s.status = 'COMPLETED'
            GROUP BY label ORDER BY amount DESC LIMIT 5
            """, w, ct)).Select(r => new ReportBreakdownItem
        {
            Key = r.S("label")!, Label = r.S("label")!, Value = r.D("amount"), FormattedValue = Currency(r.M("amount")),
            Metadata = { new ReportKeyValue("Operaciones", F0(r.D("operations"))) },
        }).ToList();

        var timeline = (await Db.QueryAsync($"""
            SELECT DATE(s.created_at) AS bucket_date, SUM(CASE WHEN s.status = 'COMPLETED' THEN s.grand_total ELSE 0 END) AS amount
            {From}{w}
            GROUP BY DATE(s.created_at) ORDER BY bucket_date LIMIT 90
            """, w, ct)).Select(r => Point(r, "amount")).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Ventas", Description = "Consolidado comercial y facturación",
            Metrics =
            {
                new() { Key = "revenue", Label = "Ingresos completados", Value = (double)revenue, FormattedValue = Currency(revenue), Unit = "S/",
                    Trend = completionRate, TrendLabel = Percentage(completionRate) },
                new() { Key = "completed", Label = "Ventas completadas", Value = completed, FormattedValue = F0(completed), Unit = "ventas",
                    Trend = total == 0 ? 0 : completed / Math.Max(1d, total), TrendLabel = total == 0 ? "0%" : Percentage(completed / total) },
                new() { Key = "draft", Label = "Cotizaciones en borrador", Value = draft, FormattedValue = F0(draft), Unit = "registros" },
                new() { Key = "voided", Label = "Ventas anuladas", Value = voided, FormattedValue = F0(voided), Unit = "registros" },
                new() { Key = "avg-ticket", Label = "Ticket promedio", Value = (double)avgTicket, FormattedValue = Currency(avgTicket), Unit = "S/" },
            },
            Breakdowns =
            {
                new() { Key = "top-products", Title = "Productos y servicios más vendidos", Items = topProducts },
                new() { Key = "top-customers", Title = "Clientes destacados", Items = topCustomers },
            },
            Timeline = timeline,
        };
    }
}

// =====================================================================================================
// Inventario
// =====================================================================================================

public sealed class InventoryReportProvider : ReportProviderBase
{
    public InventoryReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.INVENTORY;

    private static SqlWhere Where(ReportFilters f) =>
        new SqlWhere().DateRange("k.date", f, "invFrom", "invTo").Ids("k.branch_id", f.BranchIds, "invBranches");

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        var w = Where(f);
        int catalog = (await Db.OneAsync("SELECT COUNT(*) AS qty FROM products", (IReadOnlyDictionary<string, object>?)null, ct)).I("qty");
        int activeSku = (await Db.OneAsync($"SELECT COUNT(DISTINCT k.product_id) AS qty FROM kardex_movement k{w}", w, ct)).I("qty");
        ReportRow stock = await Db.OneAsync($"""
            SELECT
                COALESCE(SUM(k.quantity), 0) AS net_stock,
                COALESCE(SUM(CASE WHEN k.quantity > 0 THEN k.quantity ELSE 0 END), 0) AS inbound_units,
                COALESCE(SUM(CASE WHEN k.quantity < 0 THEN k.quantity ELSE 0 END), 0) AS outbound_units
            FROM kardex_movement k{w}
            """, w, ct);
        double net = stock.D("net_stock"), inbound = stock.D("inbound_units"), outbound = Math.Abs(stock.D("outbound_units"));

        var critical = (await Db.QueryAsync($"""
            SELECT p.name, p.min_stock, COALESCE(SUM(k.quantity), 0) AS current_stock
            FROM products p
            LEFT JOIN kardex_movement k ON k.product_id = p.id
            {w}
            GROUP BY p.id, p.name, p.min_stock
            HAVING COALESCE(SUM(k.quantity), 0) < p.min_stock
            ORDER BY current_stock ASC LIMIT 5
            """, w, ct)).Select(r => new ReportBreakdownItem
        {
            Key = r.S("name")!, Label = r.S("name")!, Value = r.D("current_stock"), FormattedValue = F2(r.D("current_stock")) + " und.",
            Metadata = { new ReportKeyValue("Stock mínimo", Int(r.I("min_stock"))) },
        }).ToList();

        var timeline = (await Db.QueryAsync($"""
            SELECT DATE(k.date) AS bucket_date, COALESCE(SUM(k.quantity), 0) AS net
            FROM kardex_movement k{w}
            GROUP BY DATE(k.date) ORDER BY bucket_date LIMIT 90
            """, w, ct)).Select(r => Point(r, "net")).ToList();

        double moved = inbound + outbound;
        return new ReportCollection
        {
            Module = Module, Title = "Inventario", Description = "Movimiento y cobertura de stock",
            Metrics =
            {
                new() { Key = "net-stock", Label = "Unidades netas en inventario", Value = net, FormattedValue = F2(net) + " und.", Unit = "und.",
                    Trend = activeSku == 0 ? 0 : critical.Count / (double)activeSku,
                    TrendLabel = critical.Count == 0 ? "Sin alertas" : critical.Count + " críticos" },
                CountMetric("active-sku", "SKU con movimientos", activeSku, "SKU"),
                CountMetric("catalog", "Productos catalogados", catalog, "SKU"),
                CountMetric("critical-items", "Alertas de stock", critical.Count, "SKU"),
            },
            Breakdowns =
            {
                new() { Key = "critical-stock", Title = "SKU bajo mínimo", Items = critical },
                new()
                {
                    Key = "movement-balance", Title = "Balance de movimientos",
                    Items =
                    {
                        new() { Key = "inbound", Label = "Entradas", Value = inbound, FormattedValue = F2(inbound) + " und.", Percentage = moved == 0 ? 0 : inbound / moved },
                        new() { Key = "outbound", Label = "Salidas", Value = outbound, FormattedValue = F2(outbound) + " und.", Percentage = moved == 0 ? 0 : outbound / moved },
                    },
                },
            },
            Timeline = timeline,
        };
    }
}

// =====================================================================================================
// Finanzas
// =====================================================================================================

public sealed class FinanceReportProvider : ReportProviderBase
{
    public FinanceReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.FINANCE;

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        var w = new SqlWhere().DateRange("m.movement_date", f, "finFrom", "finTo");
        ReportRow movements = await Db.OneAsync($"""
            SELECT
                COALESCE(SUM(CASE WHEN m.amount >= 0 THEN m.amount ELSE 0 END), 0) AS incomes,
                COALESCE(SUM(CASE WHEN m.amount < 0 THEN m.amount ELSE 0 END), 0) AS expenses
            FROM treasury_account_movements m{w}
            """, w, ct);
        decimal incomes = movements.M("incomes"), expenses = movements.M("expenses"), net = incomes + expenses;

        ReportRow payables = await Db.OneAsync("""
            SELECT COUNT(*) AS pending_count, COALESCE(SUM(total_amount - amount_paid), 0) AS pending_amount
            FROM accounts_payable WHERE status <> 'PAID'
            """, (IReadOnlyDictionary<string, object>?)null, ct);
        decimal pendingAmount = payables.M("pending_amount");
        int pendingInvoices = payables.I("pending_count");

        var suppliers = (await Db.QueryAsync("""
            SELECT s.name, COUNT(ap.id) AS invoices, SUM(ap.total_amount) AS total
            FROM accounts_payable ap LEFT JOIN suppliers s ON s.id = ap.supplier_id
            GROUP BY s.name ORDER BY total DESC LIMIT 5
            """, (IReadOnlyDictionary<string, object>?)null, ct)).Select(r => new ReportBreakdownItem
        {
            Key = r.S("name")!, Label = r.S("name")!, Value = r.D("total"), FormattedValue = Currency(r.M("total")),
            Metadata = { new ReportKeyValue("Facturas", Int(r.I("invoices"))) },
        }).ToList();

        var byStatus = (await Db.QueryAsync("""
            SELECT status, COUNT(*) AS qty, SUM(total_amount - amount_paid) AS balance FROM accounts_payable GROUP BY status
            """, (IReadOnlyDictionary<string, object>?)null, ct)).Select(r => new ReportBreakdownItem
        {
            Key = r.S("status")!, Label = r.S("status")!, Value = r.D("balance"), FormattedValue = Currency(r.M("balance")),
            Metadata = { new ReportKeyValue("Operaciones", Int(r.I("qty"))) },
        }).ToList();

        var tw = new SqlWhere().DateRange("m.movement_date", f, "finTimelineFrom", "finTimelineTo");
        var timeline = (await Db.QueryAsync($"""
            SELECT DATE(m.movement_date) AS bucket_date, SUM(m.amount) AS net
            FROM treasury_account_movements m{tw}
            GROUP BY DATE(m.movement_date) ORDER BY bucket_date LIMIT 90
            """, tw, ct)).Select(r => Point(r, "net")).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Finanzas", Description = "Tesorería y obligaciones",
            Metrics =
            {
                new() { Key = "income", Label = "Ingresos registrados", Value = (double)incomes, FormattedValue = Currency(incomes), Unit = "S/" },
                new() { Key = "expenses", Label = "Egresos", Value = (double)Math.Abs(expenses), FormattedValue = Currency(Math.Abs(expenses)), Unit = "S/" },
                new() { Key = "net-cash", Label = "Variación neta", Value = (double)net, FormattedValue = Currency(net), Unit = "S/" },
                new() { Key = "payables", Label = "Cuentas por pagar abiertas", Value = pendingInvoices, FormattedValue = Int(pendingInvoices),
                    Trend = (double)pendingAmount, TrendLabel = Currency(pendingAmount), Unit = "facturas" },
            },
            Breakdowns =
            {
                new() { Key = "suppliers", Title = "Proveedores con mayor exposición", Items = suppliers },
                new() { Key = "payables-status", Title = "Estado de cuentas por pagar", Items = byStatus },
            },
            Timeline = timeline,
        };
    }
}

// =====================================================================================================
// Clínica
// =====================================================================================================

public sealed class ClinicReportProvider : ReportProviderBase
{
    public ClinicReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.CLINIC;

    private static SqlWhere AttentionWhere(ReportFilters f) => new SqlWhere()
        .DateRange("ca.visit_date", f, "clinicFrom", "clinicTo")
        .In("ca.status", f.Statuses, "clinicStatuses")
        .Ids("att.branch_id", f.BranchIds, "clinicBranches")
        .Ids("att.animal_id", f.AnimalIds, "clinicAnimals")
        .Ids("att.attending_employee_id", f.EmployeeIds, "clinicEmployees");

    private static SqlWhere LabWhere(ReportFilters f) => new SqlWhere()
        .DateRange("lr.created_at", f, "labFrom", "labTo")
        .In("lr.status", f.Statuses, "labStatuses")
        .Ids("att.branch_id", f.BranchIds, "labBranches")
        .Ids("lr.animal_id", f.AnimalIds, "labAnimals")
        .Ids("att.attending_employee_id", f.EmployeeIds, "labEmployees");

    private static SqlWhere SurgeryWhere(ReportFilters f) => new SqlWhere()
        .DateRange("COALESCE(sr.surgery_start_at, att.check_in_time)", f, "surgeryFrom", "surgeryTo")
        .In("sr.status", f.Statuses, "surgeryStatuses")
        .Ids("att.branch_id", f.BranchIds, "surgeryBranches")
        .Ids("att.attending_employee_id", f.EmployeeIds, "surgeryEmployees");

    private const string AttFrom = " FROM clinical_attention ca JOIN attentions att ON att.id = ca.attention_id";
    private const string LabFrom = " FROM laboratory_requests lr JOIN clinical_attention ca ON ca.id = lr.clinical_attention_id JOIN attentions att ON att.id = ca.attention_id";
    private const string SurgFrom = " FROM surgical_reports sr JOIN attentions att ON att.id = sr.attention_id";

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        var aw = AttentionWhere(f);
        ReportRow summary = await Db.OneAsync($"""
            SELECT
                SUM(CASE WHEN ca.status IN ('OPEN','IN_PROGRESS') THEN 1 ELSE 0 END) AS active_cases,
                SUM(CASE WHEN ca.status = 'CLOSED' THEN 1 ELSE 0 END) AS closed_cases,
                SUM(CASE WHEN ca.status = 'CANCELED' THEN 1 ELSE 0 END) AS canceled_cases,
                SUM(CASE WHEN ca.status = 'WAITING_LAB' THEN 1 ELSE 0 END) AS waiting_lab
            {AttFrom}{aw}
            """, aw, ct);

        var lw = LabWhere(f);
        lw.Params["labTargetStatus"] = "REQUESTED";
        int labPending = (await Db.OneAsync($"SELECT COUNT(*) AS qty{LabFrom}{lw} AND lr.status = @labTargetStatus", lw, ct)).I("qty");
        var sw = SurgeryWhere(f);
        int surgeries = (await Db.OneAsync($"SELECT COUNT(*) AS qty{SurgFrom}{sw} AND sr.status IN ('DRAFT','IN_PROGRESS','READY_TO_BILL')", sw, ct)).I("qty");

        var statusItems = (await Db.QueryAsync($"SELECT ca.status, COUNT(*) AS qty{AttFrom}{aw} GROUP BY ca.status", aw, ct)).Select(r => CountItem(r, "status")).ToList();
        var lw2 = LabWhere(f);
        var labItems = (await Db.QueryAsync($"SELECT lr.status, COUNT(*) AS qty{LabFrom}{lw2} GROUP BY lr.status", lw2, ct)).Select(r => CountItem(r, "status")).ToList();
        var surgItems = (await Db.QueryAsync($"SELECT sr.status, COUNT(*) AS qty{SurgFrom}{sw} GROUP BY sr.status", sw, ct)).Select(r => CountItem(r, "status")).ToList();
        var timeline = (await Db.QueryAsync($"""
            SELECT DATE(ca.visit_date) AS bucket_date, COUNT(*) AS qty{AttFrom}{aw}
            GROUP BY DATE(ca.visit_date) ORDER BY bucket_date LIMIT 90
            """, aw, ct)).Select(r => Point(r, "qty")).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Clínica", Description = "Atenciones, laboratorio y quirófano",
            Metrics =
            {
                CountMetric("active-cases", "Casos activos", summary.I("active_cases"), "atenciones"),
                CountMetric("closed-cases", "Casos cerrados", summary.I("closed_cases"), "atenciones"),
                CountMetric("waiting-lab", "Esperando laboratorio", summary.I("waiting_lab"), "atenciones"),
                CountMetric("lab-pending", "Solicitudes de laboratorio pendientes", labPending, "solicitudes"),
                CountMetric("scheduled-surgeries", "Cirugías en curso", surgeries, "cirugías"),
            },
            Breakdowns =
            {
                new() { Key = "attention-status", Title = "Distribución de atenciones", Items = statusItems },
                new() { Key = "lab-status", Title = "Laboratorio", Items = labItems },
                new() { Key = "surgical-status", Title = "Estado quirúrgico", Items = surgItems },
            },
            Timeline = timeline,
        };
    }
}

// =====================================================================================================
// Trabajo de campo
// =====================================================================================================

public sealed class FieldworkReportProvider : ReportProviderBase
{
    public FieldworkReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.FIELDWORK;

    private const string Joins = " LEFT JOIN geo_zones gz ON gz.id = fv.zone_id LEFT JOIN farms f ON f.id = fv.farm_id";

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        var w = new SqlWhere()
            .DateRange("fv.scheduled_date_time", f, "fieldFrom", "fieldTo")
            .In("fv.status", f.Statuses, "fieldStatuses")
            .Ids("fv.zone_id", f.ZoneIds, "fieldZones")
            .Ids("fv.field_vet_employee_id", f.EmployeeIds, "fieldEmployees");

        ReportRow s = await Db.OneAsync($"""
            SELECT
                SUM(CASE WHEN fv.status = 'PLANNED' THEN 1 ELSE 0 END) AS planned,
                SUM(CASE WHEN fv.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN fv.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN fv.status = 'CANCELED' THEN 1 ELSE 0 END) AS canceled
            FROM field_visits fv{Joins}{w}
            """, w, ct);
        var status = (await Db.QueryAsync($"SELECT fv.status, COUNT(*) AS qty FROM field_visits fv{Joins}{w} GROUP BY fv.status", w, ct))
            .Select(r => CountItem(r, "status")).ToList();
        var zones = (await Db.QueryAsync($"""
            SELECT COALESCE(gz.name, 'Sin zona') AS zone_name, COUNT(*) AS qty FROM field_visits fv{Joins}{w}
            GROUP BY zone_name ORDER BY qty DESC LIMIT 5
            """, w, ct)).Select(r => CountItem(r, "zone_name")).ToList();
        var vets = (await Db.QueryAsync($"""
            SELECT CONCAT(emp.first_name, ' ', emp.last_name) AS vet_name, COUNT(*) AS qty
            FROM field_visits fv JOIN employees emp ON emp.id = fv.field_vet_employee_id{Joins}{w}
            GROUP BY vet_name ORDER BY qty DESC LIMIT 5
            """, w, ct)).Select(r => CountItem(r, "vet_name")).ToList();
        var timeline = (await Db.QueryAsync($"""
            SELECT DATE(fv.scheduled_date_time) AS bucket_date, COUNT(*) AS qty FROM field_visits fv{Joins}{w}
            GROUP BY DATE(fv.scheduled_date_time) ORDER BY bucket_date LIMIT 90
            """, w, ct)).Select(r => Point(r, "qty")).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Veterinaria de campo", Description = "Control de rutas y visitas",
            Metrics =
            {
                CountMetric("planned", "Visitas planificadas", s.I("planned"), "visitas"),
                CountMetric("in-progress", "En curso", s.I("in_progress"), "visitas"),
                CountMetric("completed", "Completadas", s.I("completed"), "visitas"),
                CountMetric("canceled", "Canceladas", s.I("canceled"), "visitas"),
            },
            Breakdowns =
            {
                new() { Key = "status", Title = "Distribución por estado", Items = status },
                new() { Key = "zones", Title = "Zonas / granjas atendidas", Items = zones },
                new() { Key = "veterinarians", Title = "Veterinarios de campo activos", Items = vets },
            },
            Timeline = timeline,
        };
    }
}

// =====================================================================================================
// Caja
// =====================================================================================================

public sealed class CashboxReportProvider : ReportProviderBase
{
    public CashboxReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.CASHBOX;

    private const string Cashier = " LEFT JOIN users cashier ON cashier.id = cs.cashier_id LEFT JOIN employees emp ON emp.id = cashier.employee_id";

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        var w = new SqlWhere()
            .DateRange("cs.opened_at", f, "cashFrom", "cashTo")
            .In("cs.status", f.Statuses, "cashStatuses")
            .Ids("cs.branch_id", f.BranchIds, "cashBranches")
            .Ids("emp.id", f.EmployeeIds, "cashEmployees");

        ReportRow s = await Db.OneAsync($"""
            SELECT
                SUM(CASE WHEN cs.status = 'OPEN' THEN 1 ELSE 0 END) AS open_sessions,
                SUM(CASE WHEN cs.status = 'CLOSED' THEN 1 ELSE 0 END) AS closed_sessions,
                COALESCE(SUM(cs.calculated_closing_amount), 0) AS calculated_total,
                COALESCE(SUM(cs.difference_amount), 0) AS differences
            FROM cash_sessions cs{Cashier}{w}
            """, w, ct);
        int open = s.I("open_sessions"), closed = s.I("closed_sessions");
        decimal calculated = s.M("calculated_total"), differences = s.M("differences");

        var payments = (await Db.QueryAsync($"""
            SELECT sp.payment_method AS method, SUM(sp.amount_paid) AS amount
            FROM sale_payments sp JOIN cash_sessions cs ON cs.id = sp.cash_session_id{Cashier}{w}
            GROUP BY sp.payment_method
            """, w, ct)).Select(r => new ReportBreakdownItem
        {
            Key = r.S("method")!, Label = r.S("method")!, Value = r.D("amount"), FormattedValue = Currency(r.M("amount")),
        }).ToList();

        var movements = (await Db.QueryAsync($"""
            SELECT csm.movement_type AS movement_type, SUM(csm.amount) AS amount
            FROM cash_session_movements csm JOIN cash_sessions cs ON cs.id = csm.cash_session_id{Cashier}{w}
            GROUP BY csm.movement_type
            """, w, ct)).Select(r =>
        {
            decimal abs = Math.Abs(r.M("amount"));
            return new ReportBreakdownItem { Key = r.S("movement_type")!, Label = r.S("movement_type")!, Value = (double)abs, FormattedValue = Currency(abs) };
        }).ToList();

        var timeline = (await Db.QueryAsync($"""
            SELECT DATE(cs.opened_at) AS bucket_date, COALESCE(SUM(cs.calculated_closing_amount), 0) AS amount
            FROM cash_sessions cs{Cashier}{w}
            GROUP BY DATE(cs.opened_at) ORDER BY bucket_date LIMIT 90
            """, w, ct)).Select(r => Point(r, "amount")).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Caja", Description = "Control de sesiones y recaudación",
            Metrics =
            {
                CountMetric("open-sessions", "Cajas abiertas", open, "cajas"),
                CountMetric("closed-sessions", "Cajas cerradas", closed, "cajas"),
                new() { Key = "calculated", Label = "Total recaudado", Value = (double)calculated, FormattedValue = Currency(calculated), Unit = "S/" },
                new() { Key = "differences", Label = "Diferencias registradas", Value = (double)Math.Abs(differences), FormattedValue = Currency(differences),
                    Unit = "S/", Trend = (double)differences },
            },
            Breakdowns =
            {
                new() { Key = "payment-methods", Title = "Medios de pago", Items = payments },
                new() { Key = "session-movements", Title = "Movimientos de caja", Items = movements },
            },
            Timeline = timeline,
        };
    }
}

// =====================================================================================================
// Clientes
// =====================================================================================================

public sealed class CustomersReportProvider : ReportProviderBase
{
    public CustomersReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.CUSTOMERS;

    private const string From = """
         FROM sales s
         LEFT JOIN customer c ON c.id = s.customer_id
         LEFT JOIN users seller ON seller.id = s.seller_id
         LEFT JOIN employees emp ON emp.id = seller.employee_id
        """;

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        ReportRow summary = await Db.OneAsync(
            "SELECT COUNT(*) AS total_customers, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_customers FROM customer",
            (IReadOnlyDictionary<string, object>?)null, ct);
        int total = summary.I("total_customers"), active = summary.I("active_customers"), inactive = total - active;

        var w = new SqlWhere()
            .DateRange("s.created_at", f, "custSalesFrom", "custSalesTo")
            .Ids("s.branch_id", f.BranchIds, "custBranches")
            .Ids("emp.id", f.EmployeeIds, "custEmployees")
            .In("s.status", f.Statuses, "custSaleStatuses")
            .Ids("s.customer_id", f.CustomerIds, "custIds");

        int buyers = (await Db.OneAsync($"SELECT COUNT(DISTINCT s.customer_id) AS qty{From}{w} AND s.customer_id IS NOT NULL", w, ct)).I("qty");
        decimal volume = (await Db.OneAsync($"SELECT COALESCE(SUM(s.grand_total), 0) AS amount{From}{w} AND s.status = 'COMPLETED'", w, ct)).M("amount");
        var top = (await Db.QueryAsync($"""
            SELECT COALESCE(c.name, 'Sin cliente') AS name, SUM(s.grand_total) AS amount, COUNT(*) AS invoices
            {From}{w} AND s.status = 'COMPLETED'
            GROUP BY name ORDER BY amount DESC LIMIT 5
            """, w, ct)).Select(r => new ReportBreakdownItem
        {
            Key = r.S("name")!, Label = r.S("name")!, Value = r.D("amount"), FormattedValue = Currency(r.M("amount")),
            Metadata = { new ReportKeyValue("Operaciones", Int(r.I("invoices"))) },
        }).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Clientes", Description = "CRM y fidelización",
            Metrics =
            {
                CountMetric("total-customers", "Clientes totales", total, "clientes"),
                new() { Key = "active-customers", Label = "Clientes activos", Value = active, FormattedValue = Int(active), Unit = "clientes",
                    Trend = total == 0 ? 0 : active / (double)total, TrendLabel = total == 0 ? null : Percentage(active / (double)total) },
                CountMetric("inactive-customers", "Clientes inactivos", inactive, "clientes"),
                new() { Key = "buyers", Label = "Clientes con compras en el periodo", Value = buyers, FormattedValue = Int(buyers),
                    Trend = (double)volume, TrendLabel = Currency(volume), Unit = "clientes" },
            },
            Breakdowns = { new() { Key = "top-buyers", Title = "Compradores principales", Items = top } },
        };
    }
}

// =====================================================================================================
// Pacientes
// =====================================================================================================

public sealed class AnimalsReportProvider : ReportProviderBase
{
    public AnimalsReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.ANIMALS;

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        var w = new SqlWhere()
            .Ids("a.customer_id", f.CustomerIds, "animalCustomers")
            .Ids("a.id", f.AnimalIds, "animalIds")
            .In("a.species", f.Species, "animalSpecies");

        ReportRow s = await Db.OneAsync($"""
            SELECT COUNT(*) AS total_animals,
                   SUM(CASE WHEN a.is_active THEN 1 ELSE 0 END) AS active_animals,
                   COALESCE(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.birth_date))), 0) AS avg_age
            FROM animal a{w}
            """, w, ct);
        double avgAge = s.D("avg_age");
        var species = (await Db.QueryAsync($"SELECT a.species, COUNT(*) AS qty FROM animal a{w} GROUP BY a.species", w, ct))
            .Select(r => CountItem(r, "species")).ToList();
        var owners = (await Db.QueryAsync($"""
            SELECT c.name AS owner, COUNT(*) AS qty FROM animal a JOIN customer c ON c.id = a.customer_id{w}
            GROUP BY c.name ORDER BY qty DESC LIMIT 5
            """, w, ct)).Select(r => CountItem(r, "owner")).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Pacientes", Description = "Composición de pacientes y propietarios",
            Metrics =
            {
                CountMetric("total-animals", "Pacientes registrados", s.I("total_animals"), "pacientes"),
                CountMetric("active-animals", "Pacientes activos", s.I("active_animals"), "pacientes"),
                new() { Key = "avg-age", Label = "Edad promedio", Value = avgAge, FormattedValue = F1(avgAge) + " años", Unit = "años" },
            },
            Breakdowns =
            {
                new() { Key = "species", Title = "Distribución por especie", Items = species },
                new() { Key = "owners", Title = "Propietarios con más mascotas activas", Items = owners },
            },
        };
    }
}

// =====================================================================================================
// Talento humano
// =====================================================================================================

public sealed class EmployeesReportProvider : ReportProviderBase
{
    public EmployeesReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.EMPLOYEES;

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        var w = new SqlWhere().Ids("e.id", f.EmployeeIds, "empIds");
        if (f.BranchIds.Length > 0)
        {
            w.Raw(" AND EXISTS (SELECT 1 FROM employee_branch eb2 WHERE eb2.employee_id = e.id AND eb2.branch_id = ANY(@empFilterBranches) AND eb2.active = true)");
            w.Params["empFilterBranches"] = f.BranchIds;
        }
        ReportRow s = await Db.OneAsync($"SELECT COUNT(*) AS total_employees, SUM(CASE WHEN e.is_field_vet THEN 1 ELSE 0 END) AS field_vets FROM employees e{w}", w, ct);
        int total = s.I("total_employees"), fieldVets = s.I("field_vets");
        var burdens = (await Db.QueryAsync($"SELECT e.burden, COUNT(*) AS qty FROM employees e{w} GROUP BY e.burden", w, ct))
            .Select(r => CountItem(r, "burden")).ToList();

        var bw = new SqlWhere(" WHERE eb.active = true").Ids("eb.branch_id", f.BranchIds, "empBranches");
        var branches = (await Db.QueryAsync($"""
            SELECT b.name AS branch_name, COUNT(DISTINCT eb.employee_id) AS qty
            FROM employee_branch eb JOIN branches b ON b.id = eb.branch_id{bw}
            GROUP BY b.name ORDER BY qty DESC
            """, bw, ct)).Select(r => CountItem(r, "branch_name")).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Talento humano", Description = "Distribución y asignaciones",
            Metrics =
            {
                CountMetric("total-staff", "Colaboradores registrados", total, "personas"),
                new() { Key = "field-vets", Label = "Veterinarios de campo", Value = fieldVets, FormattedValue = Int(fieldVets), Unit = "personas",
                    Trend = total == 0 ? 0 : fieldVets / (double)total, TrendLabel = total == 0 ? null : F1(100 * fieldVets / (double)total) + "%" },
            },
            Breakdowns =
            {
                new() { Key = "burdens", Title = "Cargos", Items = burdens },
                new() { Key = "branches", Title = "Cobertura por sede", Items = branches },
            },
        };
    }
}

// =====================================================================================================
// Sedes
// =====================================================================================================

public sealed class BranchesReportProvider : ReportProviderBase
{
    public BranchesReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.BRANCHES;

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        ReportRow counts = await Db.OneAsync("""
            SELECT (SELECT COUNT(*) FROM branches) AS branches,
                   (SELECT COUNT(*) FROM laboratories) AS labs,
                   (SELECT COUNT(*) FROM operating_rooms) AS rooms
            """, (IReadOnlyDictionary<string, object>?)null, ct);
        var w = new SqlWhere("");
        if (f.BranchIds.Length > 0)
        {
            w.Raw(" WHERE b.id = ANY(@branchFilter)");
            w.Params["branchFilter"] = f.BranchIds;
        }
        var list = (await Db.QueryAsync($"""
            SELECT b.name, b.location, c.name AS company_name
            FROM branches b JOIN companies c ON c.id = b.company_id{w}
            ORDER BY b.name
            """, w, ct)).Select(r => new ReportBreakdownItem
        {
            Key = r.S("name")!, Label = r.S("name")!, Value = null, FormattedValue = r.S("location"),
            Metadata = { new ReportKeyValue("Compañía", r.S("company_name") ?? "") },
        }).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Sedes", Description = "Infraestructura disponible",
            Metrics =
            {
                CountMetric("branches", "Sedes registradas", counts.I("branches"), "sedes"),
                CountMetric("labs", "Laboratorios internos", counts.I("labs"), "laboratorios"),
                CountMetric("operating-rooms", "Quirófanos equipados", counts.I("rooms"), "quirófanos"),
            },
            Breakdowns = { new() { Key = "branch-list", Title = "Sedes y ubicación", Items = list } },
        };
    }
}

// =====================================================================================================
// Usuarios
// =====================================================================================================

public sealed class UsersReportProvider : ReportProviderBase
{
    public UsersReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.USERS;

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        ReportRow s = await Db.OneAsync("SELECT COUNT(*) AS total_users, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_users FROM users",
            (IReadOnlyDictionary<string, object>?)null, ct);
        var roles = (await Db.QueryAsync("""
            SELECT r.name AS role_name, COUNT(*) AS qty
            FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.roles_id
            GROUP BY r.name ORDER BY qty DESC
            """, (IReadOnlyDictionary<string, object>?)null, ct)).Select(r => CountItem(r, "role_name")).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Usuarios", Description = "Accesos y roles del sistema",
            Metrics =
            {
                CountMetric("total-users", "Usuarios registrados", s.I("total_users"), "usuarios"),
                CountMetric("active-users", "Usuarios activos", s.I("active_users"), "usuarios"),
            },
            Breakdowns = { new() { Key = "roles", Title = "Distribución por rol", Items = roles } },
        };
    }
}

// =====================================================================================================
// Portal público (citas)
// =====================================================================================================

public sealed class PublicPortalReportProvider : ReportProviderBase
{
    public PublicPortalReportProvider(ReportDb db) : base(db) { }
    public override ReportModule Module => ReportModule.PUBLIC_PORTAL;

    public override async Task<ReportCollection> BuildAsync(ReportFilters f, CancellationToken ct)
    {
        var w = new SqlWhere()
            .DateRange("a.start_date_time", f, "portalFrom", "portalTo")
            .In("a.status", f.Statuses, "portalStatuses")
            .Ids("a.branch_id", f.BranchIds, "portalBranches")
            .Ids("a.animal_id", f.AnimalIds, "portalAnimals")
            .Ids("a.employee_id", f.EmployeeIds, "portalEmployees");

        ReportRow s = await Db.OneAsync($"""
            SELECT
                SUM(CASE WHEN a.status = 'REQUESTED' THEN 1 ELSE 0 END) AS requested,
                SUM(CASE WHEN a.status IN ('CONFIRMED','ASSIGNED') THEN 1 ELSE 0 END) AS confirmed,
                SUM(CASE WHEN a.status = 'CANCELED' THEN 1 ELSE 0 END) AS canceled
            FROM appointments a{w}
            """, w, ct);
        var status = (await Db.QueryAsync($"SELECT a.status, COUNT(*) AS qty FROM appointments a{w} GROUP BY a.status", w, ct))
            .Select(r => CountItem(r, "status")).ToList();
        var timeline = (await Db.QueryAsync($"""
            SELECT DATE(a.start_date_time) AS bucket_date, COUNT(*) AS qty FROM appointments a{w}
            GROUP BY DATE(a.start_date_time) ORDER BY bucket_date LIMIT 90
            """, w, ct)).Select(r => Point(r, "qty")).ToList();

        return new ReportCollection
        {
            Module = Module, Title = "Portal público", Description = "Flujo de auto-servicio",
            Metrics =
            {
                CountMetric("requested", "Solicitudes recibidas", s.I("requested"), "citas"),
                CountMetric("confirmed", "Confirmadas", s.I("confirmed"), "citas"),
                CountMetric("canceled", "Canceladas", s.I("canceled"), "citas"),
            },
            Breakdowns = { new() { Key = "appointment-status", Title = "Estado de citas", Items = status } },
            Timeline = timeline,
        };
    }
}
