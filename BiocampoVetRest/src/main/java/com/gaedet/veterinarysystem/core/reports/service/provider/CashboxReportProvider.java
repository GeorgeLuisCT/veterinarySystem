package com.gaedet.veterinarysystem.core.reports.service.provider;

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
public class CashboxReportProvider extends AbstractJdbcReportProvider {

    public CashboxReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.CASHBOX;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        Map<String, Object> summary = summarizeSessions(filters);

        Number openSessionsNum = (Number) summary.get("open_sessions");
        int openSessions = (openSessionsNum == null) ? 0 : openSessionsNum.intValue();

        Number closedSessionsNum = (Number) summary.get("closed_sessions");
        int closedSessions = (closedSessionsNum == null) ? 0 : closedSessionsNum.intValue();

        BigDecimal calculated = asBigDecimal((Number) summary.get("calculated_total"));
        BigDecimal differences = asBigDecimal((Number) summary.get("differences"));

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("open-sessions")
                        .label("Cajas abiertas")
                        .value((double) openSessions)
                        .formattedValue(String.valueOf(openSessions))
                        .unit("cajas")
                        .build(),
                ReportMetric.builder()
                        .key("closed-sessions")
                        .label("Cajas cerradas")
                        .value((double) closedSessions)
                        .formattedValue(String.valueOf(closedSessions))
                        .unit("cajas")
                        .build(),
                ReportMetric.builder()
                        .key("calculated")
                        .label("Total recaudado")
                        .value(calculated.doubleValue())
                        .formattedValue(ReportNumberUtils.currency(calculated))
                        .unit("S/")
                        .build(),
                ReportMetric.builder()
                        .key("differences")
                        .label("Diferencias registradas")
                        .value(differences.abs().doubleValue())
                        .formattedValue(ReportNumberUtils.currency(differences))
                        .unit("S/")
                        .trend(differences.doubleValue())
                        .build()
        );

        List<ReportBreakdownGroup> breakdowns = List.of(
                ReportBreakdownGroup.builder()
                        .key("payment-methods")
                        .title("Medios de pago")
                        .items(paymentBreakdown(filters))
                        .build(),
                ReportBreakdownGroup.builder()
                        .key("session-movements")
                        .title("Movimientos de caja")
                        .items(cashMovements(filters))
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Caja")
                .description("Control de sesiones y recaudación")
                .metrics(metrics)
                .breakdowns(breakdowns)
                .timeline(cashTimeline(filters))
                .build();
    }

    private Map<String, Object> summarizeSessions(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildSessionWhere(filters, params);
        return jdbcTemplate.queryForMap("""
                SELECT
                    SUM(CASE WHEN cs.status = 'OPEN' THEN 1 ELSE 0 END) AS open_sessions,
                    SUM(CASE WHEN cs.status = 'CLOSED' THEN 1 ELSE 0 END) AS closed_sessions,
                    COALESCE(SUM(cs.calculated_closing_amount), 0) AS calculated_total,
                    COALESCE(SUM(cs.difference_amount), 0) AS differences
                FROM cash_sessions cs
                LEFT JOIN users cashier ON cashier.id = cs.cashier_id
                LEFT JOIN employees emp ON emp.id = cashier.employee_id
                """ + where, params);
    }

    private List<ReportBreakdownItem> paymentBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildSessionWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT sp.payment_method AS method,
                               SUM(sp.amount_paid) AS amount
                        FROM sale_payments sp
                        JOIN cash_sessions cs ON cs.id = sp.cash_session_id
                        LEFT JOIN users cashier ON cashier.id = cs.cashier_id
                        LEFT JOIN employees emp ON emp.id = cashier.employee_id
                        """ + where + """
                         GROUP BY sp.payment_method
                        """, params, (rs, rowNum) -> {
            BigDecimal amount = rs.getBigDecimal("amount");
            return ReportBreakdownItem.builder()
                    .key(rs.getString("method"))
                    .label(rs.getString("method"))
                    .value(amount == null ? 0d : amount.doubleValue())
                    .formattedValue(ReportNumberUtils.currency(amount))
                    .build();
        });
    }

    private List<ReportBreakdownItem> cashMovements(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildSessionWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT csm.movement_type AS movement_type,
                               SUM(csm.amount) AS amount
                        FROM cash_session_movements csm
                        JOIN cash_sessions cs ON cs.id = csm.cash_session_id
                        LEFT JOIN users cashier ON cashier.id = cs.cashier_id
                        LEFT JOIN employees emp ON emp.id = cashier.employee_id
                        """ + where + """
                         GROUP BY csm.movement_type
                        """, params, (rs, rowNum) -> {
            BigDecimal amount = rs.getBigDecimal("amount");
            BigDecimal absAmount = (amount == null) ? BigDecimal.ZERO : amount.abs();
            return ReportBreakdownItem.builder()
                    .key(rs.getString("movement_type"))
                    .label(rs.getString("movement_type"))
                    .value(absAmount.doubleValue())
                    .formattedValue(ReportNumberUtils.currency(absAmount))
                    .build();
        });
    }

    private List<ReportSeriesPoint> cashTimeline(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildSessionWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT DATE(cs.opened_at) AS bucket_date,
                               COALESCE(SUM(cs.calculated_closing_amount), 0) AS amount
                        FROM cash_sessions cs
                        LEFT JOIN users cashier ON cashier.id = cs.cashier_id
                        LEFT JOIN employees emp ON emp.id = cashier.employee_id
                        """ + where + """
                         GROUP BY DATE(cs.opened_at)
                        ORDER BY bucket_date
                        LIMIT 90
                        """, params, (rs, rowNum) -> {
            Date date = rs.getDate("bucket_date");
            LocalDate bucket = date.toLocalDate();
            BigDecimal amount = rs.getBigDecimal("amount");
            return ReportSeriesPoint.builder()
                    .key(bucket.toString())
                    .label(bucket.toString())
                    .value(amount == null ? 0d : amount.doubleValue())
                    .build();
        });
    }

    private String buildSessionWhere(ReportFilters filters, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendDateRange(where, params, "cs.opened_at", filters, "cashFrom", "cashTo");
        ReportSqlHelper.appendStatusesFilter(where, params, "cs.status", filters.getStatuses(), "cashStatuses");
        ReportSqlHelper.appendIdsFilter(where, params, "cs.branch_id", filters.getBranchIds(), "cashBranches");
        if (filters.getEmployeeIds() != null && !filters.getEmployeeIds().isEmpty()) {
            where.append(" AND emp.id IN (:cashEmployees)");
            params.addValue("cashEmployees", filters.getEmployeeIds());
        }
        return where.toString();
    }
}
