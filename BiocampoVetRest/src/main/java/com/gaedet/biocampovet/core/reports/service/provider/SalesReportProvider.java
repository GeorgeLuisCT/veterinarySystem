package com.gaedet.biocampovet.core.reports.service.provider;

import com.gaedet.biocampovet.core.reports.dto.KeyValuePair;
import com.gaedet.biocampovet.core.reports.dto.ReportBreakdownGroup;
import com.gaedet.biocampovet.core.reports.dto.ReportBreakdownItem;
import com.gaedet.biocampovet.core.reports.dto.ReportCollection;
import com.gaedet.biocampovet.core.reports.dto.ReportMetric;
import com.gaedet.biocampovet.core.reports.dto.ReportSeriesPoint;
import com.gaedet.biocampovet.core.reports.enums.ReportModule;
import com.gaedet.biocampovet.core.reports.service.ReportFilters;
import com.gaedet.biocampovet.core.reports.service.ReportNumberUtils;
import com.gaedet.biocampovet.core.reports.service.ReportSqlHelper;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
public class SalesReportProvider extends AbstractJdbcReportProvider {

    public SalesReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.SALES;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);

        Map<String, Object> summary = jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) AS total_sales,
                    SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_sales,
                    SUM(CASE WHEN s.status = 'DRAFT' THEN 1 ELSE 0 END) AS draft_sales,
                    SUM(CASE WHEN s.status = 'VOIDED' THEN 1 ELSE 0 END) AS voided_sales,
                    COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.grand_total ELSE 0 END), 0) AS revenue,
                    COALESCE(AVG(CASE WHEN s.status = 'COMPLETED' THEN s.grand_total END), 0) AS avg_ticket
                FROM sales s
                LEFT JOIN customer c ON c.id = s.customer_id
                LEFT JOIN users seller ON seller.id = s.seller_id
                LEFT JOIN employees emp ON emp.id = seller.employee_id
                """ + where, params);

        List<ReportMetric> metrics = buildMetrics(summary);

        List<ReportBreakdownGroup> breakdowns = List.of(
                ReportBreakdownGroup.builder()
                        .key("top-products")
                        .title("Productos y servicios más vendidos")
                        .items(buildTopProducts(filters))
                        .build(),
                ReportBreakdownGroup.builder()
                        .key("top-customers")
                        .title("Clientes destacados")
                        .items(buildTopCustomers(filters))
                        .build()
        );

        List<ReportSeriesPoint> timeline = buildTimeline(filters);

        return ReportCollection.builder()
                .module(module())
                .title("Ventas")
                .description("Consolidado comercial y facturación")
                .metrics(metrics)
                .breakdowns(breakdowns)
                .timeline(timeline)
                .build();
    }

    private List<ReportMetric> buildMetrics(Map<String, Object> summary) {
        double total = asDouble((Number) summary.get("total_sales"));
        double completed = asDouble((Number) summary.get("completed_sales"));
        double draft = asDouble((Number) summary.get("draft_sales"));
        double voided = asDouble((Number) summary.get("voided_sales"));
        BigDecimal revenue = asBigDecimal((Number) summary.get("revenue"));
        BigDecimal avgTicket = asBigDecimal((Number) summary.get("avg_ticket"));
        double completionRate = total == 0 ? 0 : completed / total;

        return List.of(
                ReportMetric.builder()
                        .key("revenue")
                        .label("Ingresos completados")
                        .value(revenue.doubleValue())
                        .formattedValue(ReportNumberUtils.currency(revenue))
                        .unit("S/")
                        .trend(completionRate)
                        .trendLabel(ReportNumberUtils.percentage(completionRate))
                        .build(),
                ReportMetric.builder()
                        .key("completed")
                        .label("Ventas completadas")
                        .value(completed)
                        .formattedValue(String.format("%.0f", completed))
                        .unit("ventas")
                        .trend(total == 0 ? 0 : completed / Math.max(1d, total))
                        .trendLabel(total == 0 ? "0%" : ReportNumberUtils.percentage(completed / total))
                        .build(),
                ReportMetric.builder()
                        .key("draft")
                        .label("Cotizaciones en borrador")
                        .value(draft)
                        .formattedValue(String.format("%.0f", draft))
                        .unit("registros")
                        .build(),
                ReportMetric.builder()
                        .key("voided")
                        .label("Ventas anuladas")
                        .value(voided)
                        .formattedValue(String.format("%.0f", voided))
                        .unit("registros")
                        .build(),
                ReportMetric.builder()
                        .key("avg-ticket")
                        .label("Ticket promedio")
                        .value(avgTicket.doubleValue())
                        .formattedValue(ReportNumberUtils.currency(avgTicket))
                        .unit("S/")
                        .build()
        );
    }

    private List<ReportBreakdownItem> buildTopProducts(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT
                            COALESCE(p.name, sd.item_description) AS label,
                            SUM(sd.line_subtotal) AS amount,
                            SUM(sd.quantity) AS quantity
                        FROM sale_details sd
                        JOIN sales s ON s.id = sd.sale_id
                        LEFT JOIN products p ON p.id = sd.product_id
                        LEFT JOIN customer c ON c.id = s.customer_id
                        LEFT JOIN users seller ON seller.id = s.seller_id
                        LEFT JOIN employees emp ON emp.id = seller.employee_id
                        """ + where + """
                        AND s.status = 'COMPLETED'
                        GROUP BY label
                        ORDER BY amount DESC
                        LIMIT 5
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("label"))
                .label(rs.getString("label"))
                .value(asDouble((Number) rs.getObject("amount")))
                .formattedValue(ReportNumberUtils.currency(asBigDecimal((Number) rs.getObject("amount"))))
                .metadata(List.of(
                        KeyValuePair.builder()
                                .key("Cantidad")
                                .value(String.format("%.2f und.", asDouble((Number) rs.getObject("quantity"))))
                                .build()
                ))
                .build());
    }

    private List<ReportBreakdownItem> buildTopCustomers(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT
                            COALESCE(c.name, 'Cliente mostrador') AS label,
                            COUNT(s.id) AS operations,
                            SUM(s.grand_total) AS amount
                        FROM sales s
                        LEFT JOIN customer c ON c.id = s.customer_id
                        LEFT JOIN users seller ON seller.id = s.seller_id
                        LEFT JOIN employees emp ON emp.id = seller.employee_id
                        """ + where + """
                        AND s.status = 'COMPLETED'
                        GROUP BY label
                        ORDER BY amount DESC
                        LIMIT 5
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("label"))
                .label(rs.getString("label"))
                .value(asDouble((Number) rs.getObject("amount")))
                .formattedValue(ReportNumberUtils.currency(asBigDecimal((Number) rs.getObject("amount"))))
                .metadata(List.of(
                        KeyValuePair.builder()
                                .key("Operaciones")
                                .value(String.format("%.0f", asDouble((Number) rs.getObject("operations"))))
                                .build()
                ))
                .build());
    }

    private List<ReportSeriesPoint> buildTimeline(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT DATE(s.created_at) AS bucket_date,
                               SUM(CASE WHEN s.status = 'COMPLETED' THEN s.grand_total ELSE 0 END) AS amount
                        FROM sales s
                        LEFT JOIN customer c ON c.id = s.customer_id
                        LEFT JOIN users seller ON seller.id = s.seller_id
                        LEFT JOIN employees emp ON emp.id = seller.employee_id
                        """ + where + """
                        GROUP BY DATE(s.created_at)
                        ORDER BY bucket_date
                        LIMIT 90
                        """, params, new TimelineRowMapper());
    }

    private String buildWhere(ReportFilters filters, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendDateRange(where, params, "s.created_at", filters, "salesFrom", "salesTo");
        if ((filters.getStatuses() == null || filters.getStatuses().isEmpty()) && !filters.isIncludeVoided()) {
            where.append(" AND s.status <> 'VOIDED'");
        }
        ReportSqlHelper.appendStatusesFilter(where, params, "s.status", filters.getStatuses(), "saleStatuses");
        ReportSqlHelper.appendIdsFilter(where, params, "s.branch_id", filters.getBranchIds(), "saleBranchIds");
        if (!filters.getEmployeeIds().isEmpty()) {
            where.append(" AND seller.employee_id IN (:saleEmployeeIds)");
            params.addValue("saleEmployeeIds", filters.getEmployeeIds());
        }
        ReportSqlHelper.appendIdsFilter(where, params, "s.customer_id", filters.getCustomerIds(), "saleCustomerIds");
        if (filters.getSearch() != null) {
            ReportSqlHelper.appendSearch(where, params,
                    "LOWER(COALESCE(c.name,'')) LIKE :saleSearch OR LOWER(COALESCE(c.document_number,'')) LIKE :saleSearch " +
                            "OR LOWER(COALESCE(s.document_number,'')) LIKE :saleSearch",
                    "saleSearch",
                    filters.getSearch());
        }
        return where.toString();
    }

    private static class TimelineRowMapper implements RowMapper<ReportSeriesPoint> {
        @Override
        public ReportSeriesPoint mapRow(ResultSet rs, int rowNum) throws SQLException {
            Date bucketDate = rs.getDate("bucket_date");
            LocalDate date = bucketDate.toLocalDate();
            BigDecimal amount = rs.getBigDecimal("amount");
            return ReportSeriesPoint.builder()
                    .key(date.toString())
                    .label(date.toString())
                    .value(amount == null ? 0d : amount.doubleValue())
                    .build();
        }
    }
}
