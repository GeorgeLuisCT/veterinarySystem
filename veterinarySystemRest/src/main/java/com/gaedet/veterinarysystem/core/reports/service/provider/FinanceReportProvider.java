package com.gaedet.veterinarysystem.core.reports.service.provider;

import com.gaedet.veterinarysystem.core.reports.dto.KeyValuePair;
import com.gaedet.veterinarysystem.core.reports.dto.ReportBreakdownGroup;
import com.gaedet.veterinarysystem.core.reports.dto.ReportBreakdownItem;
import com.gaedet.veterinarysystem.core.reports.dto.ReportCollection;
import com.gaedet.veterinarysystem.core.reports.dto.ReportMetric;
import com.gaedet.veterinarysystem.core.reports.dto.ReportSeriesPoint;
import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
import com.gaedet.veterinarysystem.core.reports.service.ReportFilters;
import com.gaedet.veterinarysystem.core.reports.service.ReportNumberUtils;
import com.gaedet.veterinarysystem.core.reports.service.ReportSqlHelper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
public class FinanceReportProvider extends AbstractJdbcReportProvider {

    public FinanceReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.FINANCE;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        Map<String, Object> movements = summarizeMovements(filters);
        BigDecimal incomes = asBigDecimal((Number) movements.get("incomes"));
        BigDecimal expenses = asBigDecimal((Number) movements.get("expenses"));
        BigDecimal net = incomes.add(expenses);

        Map<String, Object> payables = summarizePayables();
        BigDecimal pendingAmount = asBigDecimal((Number) payables.get("pending_amount"));
        int pendingInvoices = ((Number) payables.getOrDefault("pending_count", 0)).intValue();

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("income")
                        .label("Ingresos registrados")
                        .value(incomes.doubleValue())
                        .formattedValue(ReportNumberUtils.currency(incomes))
                        .unit("S/")
                        .build(),
                ReportMetric.builder()
                        .key("expenses")
                        .label("Egresos")
                        .value(expenses.abs().doubleValue())
                        .formattedValue(ReportNumberUtils.currency(expenses.abs()))
                        .unit("S/")
                        .build(),
                ReportMetric.builder()
                        .key("net-cash")
                        .label("Variación neta")
                        .value(net.doubleValue())
                        .formattedValue(ReportNumberUtils.currency(net))
                        .unit("S/")
                        .build(),
                ReportMetric.builder()
                        .key("payables")
                        .label("Cuentas por pagar abiertas")
                        .value((double) pendingInvoices)
                        .formattedValue(String.valueOf(pendingInvoices))
                        .trend(pendingAmount.doubleValue())
                        .trendLabel(ReportNumberUtils.currency(pendingAmount))
                        .unit("facturas")
                        .build()
        );

        List<ReportBreakdownGroup> breakdowns = List.of(
                ReportBreakdownGroup.builder()
                        .key("suppliers")
                        .title("Proveedores con mayor exposición")
                        .items(topSuppliers())
                        .build(),
                ReportBreakdownGroup.builder()
                        .key("payables-status")
                        .title("Estado de cuentas por pagar")
                        .items(payablesByStatus())
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Finanzas")
                .description("Tesorería y obligaciones")
                .metrics(metrics)
                .breakdowns(breakdowns)
                .timeline(buildFinanceTimeline(filters))
                .build();
    }

    private Map<String, Object> summarizeMovements(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendDateRange(where, params, "m.movement_date", filters, "finFrom", "finTo");
        return jdbcTemplate.queryForMap("""
                SELECT
                    COALESCE(SUM(CASE WHEN m.amount >= 0 THEN m.amount ELSE 0 END), 0) AS incomes,
                    COALESCE(SUM(CASE WHEN m.amount < 0 THEN m.amount ELSE 0 END), 0) AS expenses
                FROM treasury_account_movements m
                """ + where, params);
    }

    private Map<String, Object> summarizePayables() {
        return jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) AS pending_count,
                    COALESCE(SUM(total_amount - amount_paid), 0) AS pending_amount
                FROM accounts_payable
                WHERE status <> 'PAID'
                """, new MapSqlParameterSource());
    }

    private List<ReportBreakdownItem> topSuppliers() {
        return jdbcTemplate.query("""
                        SELECT s.name,
                               COUNT(ap.id) AS invoices,
                               SUM(ap.total_amount) AS total
                        FROM accounts_payable ap
                        LEFT JOIN suppliers s ON s.id = ap.supplier_id
                        GROUP BY s.name
                        ORDER BY total DESC
                        LIMIT 5
                        """, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("name"))
                .label(rs.getString("name"))
                .value(asDouble((Number) rs.getObject("total")))
                .formattedValue(ReportNumberUtils.currency(asBigDecimal((Number) rs.getObject("total"))))
                .metadata(List.of(
                        KeyValuePair.builder()
                                .key("Facturas")
                                .value(String.valueOf(rs.getInt("invoices")))
                                .build()
                ))
                .build());
    }

    private List<ReportBreakdownItem> payablesByStatus() {
        return jdbcTemplate.query("""
                        SELECT status,
                               COUNT(*) AS qty,
                               SUM(total_amount - amount_paid) AS balance
                        FROM accounts_payable
                        GROUP BY status
                        """, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("status"))
                .label(rs.getString("status"))
                .value(asDouble((Number) rs.getObject("balance")))
                .formattedValue(ReportNumberUtils.currency(asBigDecimal((Number) rs.getObject("balance"))))
                .metadata(List.of(
                        KeyValuePair.builder()
                                .key("Operaciones")
                                .value(String.valueOf(rs.getInt("qty")))
                                .build()
                ))
                .build());
    }

    private List<ReportSeriesPoint> buildFinanceTimeline(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendDateRange(where, params, "m.movement_date", filters, "finTimelineFrom", "finTimelineTo");
        return jdbcTemplate.query("""
                        SELECT DATE(m.movement_date) AS bucket_date,
                               SUM(m.amount) AS net
                        FROM treasury_account_movements m
                        """ + where + """
                         GROUP BY DATE(m.movement_date)
                        ORDER BY bucket_date
                        LIMIT 90
                        """, params, (rs, rowNum) -> {
            Date date = rs.getDate("bucket_date");
            BigDecimal net = rs.getBigDecimal("net");
            LocalDate bucket = date.toLocalDate();
            return ReportSeriesPoint.builder()
                    .key(bucket.toString())
                    .label(bucket.toString())
                    .value(net == null ? 0d : net.doubleValue())
                    .build();
        });
    }
}
