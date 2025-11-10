package com.gaedet.biocampovet.core.reports.service.provider;

import com.gaedet.biocampovet.core.reports.dto.ReportBreakdownGroup;
import com.gaedet.biocampovet.core.reports.dto.ReportBreakdownItem;
import com.gaedet.biocampovet.core.reports.dto.ReportCollection;
import com.gaedet.biocampovet.core.reports.dto.ReportMetric;
import com.gaedet.biocampovet.core.reports.dto.ReportSeriesPoint;
import com.gaedet.biocampovet.core.reports.enums.ReportModule;
import com.gaedet.biocampovet.core.reports.service.ReportFilters;
import com.gaedet.biocampovet.core.reports.service.ReportSqlHelper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
public class PublicPortalReportProvider extends AbstractJdbcReportProvider {

    public PublicPortalReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.PUBLIC_PORTAL;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        Map<String, Object> summary = summarizeAppointments(filters);

        Number requestedNum = (Number) summary.get("requested");
        int requested = (requestedNum == null) ? 0 : requestedNum.intValue();

        Number confirmedNum = (Number) summary.get("confirmed");
        int confirmed = (confirmedNum == null) ? 0 : confirmedNum.intValue();

        Number canceledNum = (Number) summary.get("canceled");
        int canceled = (canceledNum == null) ? 0 : canceledNum.intValue();

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("requested")
                        .label("Solicitudes recibidas")
                        .value((double) requested)
                        .formattedValue(String.valueOf(requested))
                        .unit("citas")
                        .build(),
                ReportMetric.builder()
                        .key("confirmed")
                        .label("Confirmadas")
                        .value((double) confirmed)
                        .formattedValue(String.valueOf(confirmed))
                        .unit("citas")
                        .build(),
                ReportMetric.builder()
                        .key("canceled")
                        .label("Canceladas")
                        .value((double) canceled)
                        .formattedValue(String.valueOf(canceled))
                        .unit("citas")
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Portal público")
                .description("Flujo de auto-servicio")
                .metrics(metrics)
                .breakdowns(List.of(
                        ReportBreakdownGroup.builder()
                                .key("appointment-status")
                                .title("Estado de citas")
                                .items(statusBreakdown(filters))
                                .build()
                ))
                .timeline(appointmentTimeline(filters))
                .build();
    }

    private Map<String, Object> summarizeAppointments(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.queryForMap("""
                SELECT
                    SUM(CASE WHEN a.status = 'REQUESTED' THEN 1 ELSE 0 END) AS requested,
                    SUM(CASE WHEN a.status IN ('CONFIRMED','ASSIGNED') THEN 1 ELSE 0 END) AS confirmed,
                    SUM(CASE WHEN a.status = 'CANCELED' THEN 1 ELSE 0 END) AS canceled
                FROM appointments a
                """ + where, params);
    }

    private List<ReportBreakdownItem> statusBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT a.status, COUNT(*) AS qty
                        FROM appointments a
                        """ + where + """
                         GROUP BY a.status
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("status"))
                .label(rs.getString("status"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private List<ReportSeriesPoint> appointmentTimeline(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT DATE(a.start_date_time) AS bucket_date,
                               COUNT(*) AS qty
                        FROM appointments a
                        """ + where + """
                         GROUP BY DATE(a.start_date_time)
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
        ReportSqlHelper.appendDateRange(where, params, "a.start_date_time", filters, "portalFrom", "portalTo");
        ReportSqlHelper.appendStatusesFilter(where, params, "a.status", filters.getStatuses(), "portalStatuses");
        ReportSqlHelper.appendIdsFilter(where, params, "a.branch_id", filters.getBranchIds(), "portalBranches");
        ReportSqlHelper.appendIdsFilter(where, params, "a.animal_id", filters.getAnimalIds(), "portalAnimals");
        if (filters.getEmployeeIds() != null && !filters.getEmployeeIds().isEmpty()) {
            where.append(" AND a.employee_id IN (:portalEmployees)");
            params.addValue("portalEmployees", filters.getEmployeeIds());
        }
        return where.toString();
    }
}