package com.gaedet.veterinarysystem.core.reports.service.provider;

import com.gaedet.veterinarysystem.core.reports.dto.ReportBreakdownGroup;
import com.gaedet.veterinarysystem.core.reports.dto.ReportBreakdownItem;
import com.gaedet.veterinarysystem.core.reports.dto.ReportCollection;
import com.gaedet.veterinarysystem.core.reports.dto.ReportMetric;
import com.gaedet.veterinarysystem.core.reports.dto.ReportSeriesPoint;
import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
import com.gaedet.veterinarysystem.core.reports.service.ReportFilters;
import com.gaedet.veterinarysystem.core.reports.service.ReportSqlHelper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
public class FieldworkReportProvider extends AbstractJdbcReportProvider {

    public FieldworkReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.FIELDWORK;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        Map<String, Object> summary = summarizeVisits(filters);

        Number plannedNum = (Number) summary.get("planned");
        int planned = (plannedNum == null) ? 0 : plannedNum.intValue();

        Number inProgressNum = (Number) summary.get("in_progress");
        int inProgress = (inProgressNum == null) ? 0 : inProgressNum.intValue();

        Number completedNum = (Number) summary.get("completed");
        int completed = (completedNum == null) ? 0 : completedNum.intValue();

        Number canceledNum = (Number) summary.get("canceled");
        int canceled = (canceledNum == null) ? 0 : canceledNum.intValue();

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("planned")
                        .label("Visitas planificadas")
                        .value((double) planned)
                        .formattedValue(String.valueOf(planned))
                        .unit("visitas")
                        .build(),
                ReportMetric.builder()
                        .key("in-progress")
                        .label("En curso")
                        .value((double) inProgress)
                        .formattedValue(String.valueOf(inProgress))
                        .unit("visitas")
                        .build(),
                ReportMetric.builder()
                        .key("completed")
                        .label("Completadas")
                        .value((double) completed)
                        .formattedValue(String.valueOf(completed))
                        .unit("visitas")
                        .build(),
                ReportMetric.builder()
                        .key("canceled")
                        .label("Canceladas")
                        .value((double) canceled)
                        .formattedValue(String.valueOf(canceled))
                        .unit("visitas")
                        .build()
        );

        List<ReportBreakdownGroup> breakdowns = List.of(
                ReportBreakdownGroup.builder()
                        .key("status")
                        .title("Distribución por estado")
                        .items(statusBreakdown(filters))
                        .build(),
                ReportBreakdownGroup.builder()
                        .key("zones")
                        .title("Zonas / granjas atendidas")
                        .items(zoneBreakdown(filters))
                        .build(),
                ReportBreakdownGroup.builder()
                        .key("veterinarians")
                        .title("Veterinarios de campo activos")
                        .items(fieldVetBreakdown(filters))
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Veterinaria de campo")
                .description("Control de rutas y visitas")
                .metrics(metrics)
                .breakdowns(breakdowns)
                .timeline(visitsTimeline(filters))
                .build();
    }

    private Map<String, Object> summarizeVisits(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.queryForMap("""
                SELECT
                    SUM(CASE WHEN fv.status = 'PLANNED' THEN 1 ELSE 0 END) AS planned,
                    SUM(CASE WHEN fv.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
                    SUM(CASE WHEN fv.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                    SUM(CASE WHEN fv.status = 'CANCELED' THEN 1 ELSE 0 END) AS canceled
                FROM field_visits fv
                LEFT JOIN geo_zones gz ON gz.id = fv.zone_id
                LEFT JOIN farms f ON f.id = fv.farm_id
                """ + where, params);
    }

    private List<ReportBreakdownItem> statusBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);

        return jdbcTemplate.query("""
                    SELECT fv.status, COUNT(*) AS qty
                    FROM field_visits fv
                    LEFT JOIN geo_zones gz ON gz.id = fv.zone_id
                    LEFT JOIN farms f ON f.id = fv.farm_id
                    """ + where + """
                     GROUP BY fv.status
                    """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("status"))
                .label(rs.getString("status"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private List<ReportBreakdownItem> zoneBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.query("""
                    SELECT COALESCE(gz.name, 'Sin zona') AS zone_name,
                           COUNT(*) AS qty
                    FROM field_visits fv
                    LEFT JOIN geo_zones gz ON gz.id = fv.zone_id
                    LEFT JOIN farms f ON f.id = fv.farm_id
                    """ + where + """
                     GROUP BY zone_name
                    ORDER BY qty DESC
                    LIMIT 5
                    """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("zone_name"))
                .label(rs.getString("zone_name"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private List<ReportBreakdownItem> fieldVetBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.query("""
                    SELECT CONCAT(emp.first_name, ' ', emp.last_name) AS vet_name,
                           COUNT(*) AS qty
                    FROM field_visits fv
                    JOIN employees emp ON emp.id = fv.field_vet_employee_id
                    LEFT JOIN geo_zones gz ON gz.id = fv.zone_id
                    LEFT JOIN farms f ON f.id = fv.farm_id
                    """ + where + """
                     GROUP BY vet_name
                    ORDER BY qty DESC
                    LIMIT 5
                    """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("vet_name"))
                .label(rs.getString("vet_name"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private List<ReportSeriesPoint> visitsTimeline(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.query("""
                    SELECT DATE(fv.scheduled_date_time) AS bucket_date,
                           COUNT(*) AS qty
                    FROM field_visits fv
                    LEFT JOIN geo_zones gz ON gz.id = fv.zone_id
                    LEFT JOIN farms f ON f.id = fv.farm_id
                    """ + where + """
                     GROUP BY DATE(fv.scheduled_date_time)
                    ORDER BY bucket_date
                    LIMIT 90
                    """, params, (rs, rowNum) -> {
            Date date = rs.getDate("bucket_date");
            LocalDate bucket = date.toLocalDate();
            return ReportSeriesPoint.builder()
                    .key(bucket.toString())
                    .label(bucket.toString())
                    .value((double) rs.getInt("qty"))
                    .build();
        });
    }

    private String buildWhere(ReportFilters filters, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendDateRange(where, params, "fv.scheduled_date_time", filters, "fieldFrom", "fieldTo");
        ReportSqlHelper.appendStatusesFilter(where, params, "fv.status", filters.getStatuses(), "fieldStatuses");
        ReportSqlHelper.appendIdsFilter(where, params, "fv.zone_id", filters.getZoneIds(), "fieldZones");
        if (!filters.getEmployeeIds().isEmpty()) {
            where.append(" AND fv.field_vet_employee_id IN (:fieldEmployees)");
            params.addValue("fieldEmployees", filters.getEmployeeIds());
        }
        return where.toString();
    }
}
