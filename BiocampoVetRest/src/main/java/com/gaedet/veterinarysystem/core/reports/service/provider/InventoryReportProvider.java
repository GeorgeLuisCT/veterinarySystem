package com.gaedet.veterinarysystem.core.reports.service.provider;

import com.gaedet.veterinarysystem.core.reports.dto.KeyValuePair;
import com.gaedet.veterinarysystem.core.reports.dto.ReportBreakdownGroup;
import com.gaedet.veterinarysystem.core.reports.dto.ReportBreakdownItem;
import com.gaedet.veterinarysystem.core.reports.dto.ReportCollection;
import com.gaedet.veterinarysystem.core.reports.dto.ReportMetric;
import com.gaedet.veterinarysystem.core.reports.dto.ReportSeriesPoint;
import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
import com.gaedet.veterinarysystem.core.reports.service.ReportFilters;
import com.gaedet.veterinarysystem.core.reports.service.ReportSqlHelper;
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
public class InventoryReportProvider extends AbstractJdbcReportProvider {

    public InventoryReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.INVENTORY;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        int skuCatalog = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products", new MapSqlParameterSource(), Integer.class);
        int activeSku = countActiveSkus(filters);

        Map<String, Object> stock = summarizeStock(filters);
        double netStock = asDouble((Number) stock.getOrDefault("net_stock", 0));
        double inbound = asDouble((Number) stock.getOrDefault("inbound_units", 0));
        double outbound = Math.abs(asDouble((Number) stock.getOrDefault("outbound_units", 0)));

        List<ReportBreakdownItem> criticalItems = findCriticalStock(filters);

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("net-stock")
                        .label("Unidades netas en inventario")
                        .value(netStock)
                        .formattedValue(String.format("%.2f und.", netStock))
                        .unit("und.")
                        .trend(activeSku == 0 ? 0 : criticalItems.size() / (double) activeSku)
                        .trendLabel(criticalItems.isEmpty() ? "Sin alertas" : criticalItems.size() + " críticos")
                        .build(),
                ReportMetric.builder()
                        .key("active-sku")
                        .label("SKU con movimientos")
                        .value((double) activeSku)
                        .formattedValue(String.valueOf(activeSku))
                        .unit("SKU")
                        .build(),
                ReportMetric.builder()
                        .key("catalog")
                        .label("Productos catalogados")
                        .value((double) skuCatalog)
                        .formattedValue(String.valueOf(skuCatalog))
                        .unit("SKU")
                        .build(),
                ReportMetric.builder()
                        .key("critical-items")
                        .label("Alertas de stock")
                        .value((double) criticalItems.size())
                        .formattedValue(String.valueOf(criticalItems.size()))
                        .unit("SKU")
                        .build()
        );

        List<ReportBreakdownGroup> breakdowns = List.of(
                ReportBreakdownGroup.builder()
                        .key("critical-stock")
                        .title("SKU bajo mínimo")
                        .items(criticalItems)
                        .build(),
                ReportBreakdownGroup.builder()
                        .key("movement-balance")
                        .title("Balance de movimientos")
                        .items(List.of(
                                ReportBreakdownItem.builder()
                                        .key("inbound")
                                        .label("Entradas")
                                        .value(inbound)
                                        .formattedValue(String.format("%.2f und.", inbound))
                                        .percentage(inbound + outbound == 0 ? 0 : inbound / (inbound + outbound))
                                        .build(),
                                ReportBreakdownItem.builder()
                                        .key("outbound")
                                        .label("Salidas")
                                        .value(outbound)
                                        .formattedValue(String.format("%.2f und.", outbound))
                                        .percentage(inbound + outbound == 0 ? 0 : outbound / (inbound + outbound))
                                        .build()
                        ))
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Inventario")
                .description("Movimiento y cobertura de stock")
                .metrics(metrics)
                .breakdowns(breakdowns)
                .timeline(buildStockTimeline(filters))
                .build();
    }

    private Map<String, Object> summarizeStock(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildKardexWhere(filters, params);
        return jdbcTemplate.queryForMap("""
                SELECT
                    COALESCE(SUM(k.quantity), 0) AS net_stock,
                    COALESCE(SUM(CASE WHEN k.quantity > 0 THEN k.quantity ELSE 0 END), 0) AS inbound_units,
                    COALESCE(SUM(CASE WHEN k.quantity < 0 THEN k.quantity ELSE 0 END), 0) AS outbound_units
                FROM kardex_movement k
                """ + where, params);
    }

    private int countActiveSkus(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildKardexWhere(filters, params);
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(DISTINCT k.product_id)
                FROM kardex_movement k
                """ + where, params, Integer.class);
        return count == null ? 0 : count;
    }

    private List<ReportBreakdownItem> findCriticalStock(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildKardexWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT p.name,
                               p.min_stock,
                               COALESCE(SUM(k.quantity), 0) AS current_stock
                        FROM products p
                        LEFT JOIN kardex_movement k ON k.product_id = p.id
                        """ + where + """
                        GROUP BY p.id, p.name, p.min_stock
                        HAVING COALESCE(SUM(k.quantity), 0) < p.min_stock
                        ORDER BY current_stock ASC
                        LIMIT 5
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("name"))
                .label(rs.getString("name"))
                .value(asDouble((Number) rs.getObject("current_stock")))
                .formattedValue(String.format("%.2f und.", asDouble((Number) rs.getObject("current_stock"))))
                .metadata(List.of(
                        KeyValuePair.builder()
                                .key("Stock mínimo")
                                .value(String.valueOf(rs.getInt("min_stock")))
                                .build()
                ))
                .build());
    }

    private List<ReportSeriesPoint> buildStockTimeline(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildKardexWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT DATE(k.date) AS bucket_date,
                               COALESCE(SUM(k.quantity), 0) AS net
                        FROM kardex_movement k
                        """ + where + """
                        GROUP BY DATE(k.date)
                        ORDER BY bucket_date
                        LIMIT 90
                        """, params, new InventoryTimelineMapper());
    }

    private String buildKardexWhere(ReportFilters filters, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendDateRange(where, params, "k.date", filters, "invFrom", "invTo");
        ReportSqlHelper.appendIdsFilter(where, params, "k.branch_id", filters.getBranchIds(), "invBranches");
        return where.toString();
    }

    private static class InventoryTimelineMapper implements RowMapper<ReportSeriesPoint> {
        @Override
        public ReportSeriesPoint mapRow(ResultSet rs, int rowNum) throws SQLException {
            Date date = rs.getDate("bucket_date");
            BigDecimal net = rs.getBigDecimal("net");
            LocalDate bucket = date.toLocalDate();
            return ReportSeriesPoint.builder()
                    .key(bucket.toString())
                    .label(bucket.toString())
                    .value(net == null ? 0d : net.doubleValue())
                    .build();
        }
    }
}
