package com.gaedet.veterinarysystem.core.reports.service.provider;

import com.gaedet.veterinarysystem.core.reports.dto.KeyValuePair;
import com.gaedet.veterinarysystem.core.reports.dto.ReportBreakdownGroup;
import com.gaedet.veterinarysystem.core.reports.dto.ReportBreakdownItem;
import com.gaedet.veterinarysystem.core.reports.dto.ReportCollection;
import com.gaedet.veterinarysystem.core.reports.dto.ReportMetric;
import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
import com.gaedet.veterinarysystem.core.reports.service.ReportFilters;
import com.gaedet.veterinarysystem.core.reports.service.ReportNumberUtils;
import com.gaedet.veterinarysystem.core.reports.service.ReportSqlHelper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
public class CustomersReportProvider extends AbstractJdbcReportProvider {

    public CustomersReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.CUSTOMERS;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        Map<String, Object> summary = jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) AS total_customers,
                    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_customers
                FROM customer
                """, new MapSqlParameterSource());

        int total = ((Number) summary.getOrDefault("total_customers", 0)).intValue();
        int active = ((Number) summary.getOrDefault("active_customers", 0)).intValue();
        int inactive = total - active;

        int customersWithSales = customersWithSales(filters);
        BigDecimal salesVolume = customerSalesVolume(filters);

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("total-customers")
                        .label("Clientes totales")
                        .value((double) total)
                        .formattedValue(String.valueOf(total))
                        .unit("clientes")
                        .build(),
                ReportMetric.builder()
                        .key("active-customers")
                        .label("Clientes activos")
                        .value((double) active)
                        .formattedValue(String.valueOf(active))
                        .unit("clientes")
                        .trend(total == 0 ? 0 : active / (double) total)
                        .trendLabel(total == 0 ? null : ReportNumberUtils.percentage(active / (double) total))
                        .build(),
                ReportMetric.builder()
                        .key("inactive-customers")
                        .label("Clientes inactivos")
                        .value((double) inactive)
                        .formattedValue(String.valueOf(inactive))
                        .unit("clientes")
                        .build(),
                ReportMetric.builder()
                        .key("buyers")
                        .label("Clientes con compras en el periodo")
                        .value((double) customersWithSales)
                        .formattedValue(String.valueOf(customersWithSales))
                        .trend(salesVolume.doubleValue())
                        .trendLabel(ReportNumberUtils.currency(salesVolume))
                        .unit("clientes")
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Clientes")
                .description("CRM y fidelización")
                .metrics(metrics)
                .breakdowns(List.of(
                        ReportBreakdownGroup.builder()
                                .key("top-buyers")
                                .title("Compradores principales")
                                .items(topCustomers(filters))
                                .build()
                ))
                .timeline(List.of())
                .build();
    }

    private int customersWithSales(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildSalesWhere(filters, params);
        Integer value = jdbcTemplate.queryForObject("""
                SELECT COUNT(DISTINCT s.customer_id)
                FROM sales s
                LEFT JOIN customer c ON c.id = s.customer_id
                LEFT JOIN users seller ON seller.id = s.seller_id
                LEFT JOIN employees emp ON emp.id = seller.employee_id
                """ + where + """
                AND s.customer_id IS NOT NULL
                """, params, Integer.class);
        return value == null ? 0 : value;
    }

    private BigDecimal customerSalesVolume(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildSalesWhere(filters, params);
        BigDecimal value = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(s.grand_total), 0)
                FROM sales s
                LEFT JOIN customer c ON c.id = s.customer_id
                LEFT JOIN users seller ON seller.id = s.seller_id
                LEFT JOIN employees emp ON emp.id = seller.employee_id
                """ + where + """
                AND s.status = 'COMPLETED'
                """, params, BigDecimal.class);
        return value == null ? BigDecimal.ZERO : value;
    }

    private List<ReportBreakdownItem> topCustomers(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildSalesWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT COALESCE(c.name, 'Sin cliente') AS name,
                               SUM(s.grand_total) AS amount,
                               COUNT(*) AS invoices
                        FROM sales s
                        LEFT JOIN customer c ON c.id = s.customer_id
                        LEFT JOIN users seller ON seller.id = s.seller_id
                        LEFT JOIN employees emp ON emp.id = seller.employee_id
                        """ + where + """
                        AND s.status = 'COMPLETED'
                        GROUP BY name
                        ORDER BY amount DESC
                        LIMIT 5
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("name"))
                .label(rs.getString("name"))
                .value(asDouble((Number) rs.getObject("amount")))
                .formattedValue(ReportNumberUtils.currency(asBigDecimal((Number) rs.getObject("amount"))))
                .metadata(List.of(
                        KeyValuePair.builder()
                                .key("Operaciones")
                                .value(String.valueOf(rs.getInt("invoices")))
                                .build()
                ))
                .build());
    }

    private String buildSalesWhere(ReportFilters filters, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendDateRange(where, params, "s.created_at", filters, "custSalesFrom", "custSalesTo");
        ReportSqlHelper.appendIdsFilter(where, params, "s.branch_id", filters.getBranchIds(), "custBranches");
        if (!filters.getEmployeeIds().isEmpty()) {
            where.append(" AND emp.id IN (:custEmployees)");
            params.addValue("custEmployees", filters.getEmployeeIds());
        }
        if (!filters.getStatuses().isEmpty()) {
            ReportSqlHelper.appendStatusesFilter(where, params, "s.status", filters.getStatuses(), "custSaleStatuses");
        }
        if (!filters.getCustomerIds().isEmpty()) {
            ReportSqlHelper.appendIdsFilter(where, params, "s.customer_id", filters.getCustomerIds(), "custIds");
        }
        return where.toString();
    }
}
