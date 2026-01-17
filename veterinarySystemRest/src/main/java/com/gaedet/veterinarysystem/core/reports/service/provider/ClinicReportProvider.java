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
public class ClinicReportProvider extends AbstractJdbcReportProvider {

    public ClinicReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.CLINIC;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        Map<String, Object> summary = summarizeAttentions(filters);

        Number activeNum = (Number) summary.get("active_cases");
        int active = (activeNum == null) ? 0 : activeNum.intValue();

        Number closedNum = (Number) summary.get("closed_cases");
        int closed = (closedNum == null) ? 0 : closedNum.intValue();

        Number canceledNum = (Number) summary.get("canceled_cases");
        int canceled = (canceledNum == null) ? 0 : canceledNum.intValue();

        Number waitingLabNum = (Number) summary.get("waiting_lab");
        int waitingLab = (waitingLabNum == null) ? 0 : waitingLabNum.intValue();

        int labPending = countLabRequests(filters, "REQUESTED");
        int surgeries = countSurgeries(filters);

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("active-cases")
                        .label("Casos activos")
                        .value((double) active)
                        .formattedValue(String.valueOf(active))
                        .unit("atenciones")
                        .build(),
                ReportMetric.builder()
                        .key("closed-cases")
                        .label("Casos cerrados")
                        .value((double) closed)
                        .formattedValue(String.valueOf(closed))
                        .unit("atenciones")
                        .build(),
                ReportMetric.builder()
                        .key("waiting-lab")
                        .label("Esperando laboratorio")
                        .value((double) waitingLab)
                        .formattedValue(String.valueOf(waitingLab))
                        .unit("atenciones")
                        .build(),
                ReportMetric.builder()
                        .key("lab-pending")
                        .label("Solicitudes de laboratorio pendientes")
                        .value((double) labPending)
                        .formattedValue(String.valueOf(labPending))
                        .unit("solicitudes")
                        .build(),
                ReportMetric.builder()
                        .key("scheduled-surgeries")
                        .label("Cirugías en curso")
                        .value((double) surgeries)
                        .formattedValue(String.valueOf(surgeries))
                        .unit("cirugías")
                        .build()
        );

        List<ReportBreakdownGroup> breakdowns = List.of(
                ReportBreakdownGroup.builder()
                        .key("attention-status")
                        .title("Distribución de atenciones")
                        .items(statusBreakdown(filters))
                        .build(),
                ReportBreakdownGroup.builder()
                        .key("lab-status")
                        .title("Laboratorio")
                        .items(labBreakdown(filters))
                        .build(),
                ReportBreakdownGroup.builder()
                        .key("surgical-status")
                        .title("Estado quirúrgico")
                        .items(surgeryBreakdown(filters))
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Clínica")
                .description("Atenciones, laboratorio y quirófano")
                .metrics(metrics)
                .breakdowns(breakdowns)
                .timeline(attentionTimeline(filters))
                .build();
    }

    private Map<String, Object> summarizeAttentions(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildAttentionWhere(filters, params);
        return jdbcTemplate.queryForMap("""
                SELECT
                    SUM(CASE WHEN ca.status IN ('OPEN','IN_PROGRESS') THEN 1 ELSE 0 END) AS active_cases,
                    SUM(CASE WHEN ca.status = 'CLOSED' THEN 1 ELSE 0 END) AS closed_cases,
                    SUM(CASE WHEN ca.status = 'CANCELED' THEN 1 ELSE 0 END) AS canceled_cases,
                    SUM(CASE WHEN ca.status = 'WAITING_LAB' THEN 1 ELSE 0 END) AS waiting_lab
                FROM clinical_attention ca
                JOIN attentions att ON att.id = ca.attention_id
                """ + where, params);
    }

    private List<ReportBreakdownItem> statusBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildAttentionWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT ca.status, COUNT(*) AS qty
                        FROM clinical_attention ca
                        JOIN attentions att ON att.id = ca.attention_id
                        """ + where + """
                        GROUP BY ca.status
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("status"))
                .label(rs.getString("status"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private List<ReportBreakdownItem> labBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildLabWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT lr.status, COUNT(*) AS qty
                        FROM laboratory_requests lr
                        JOIN clinical_attention ca ON ca.id = lr.clinical_attention_id
                        JOIN attentions att ON att.id = ca.attention_id
                        """ + where + """
                        GROUP BY lr.status
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("status"))
                .label(rs.getString("status"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private List<ReportBreakdownItem> surgeryBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildSurgeryWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT sr.status, COUNT(*) AS qty
                        FROM surgical_reports sr
                        JOIN attentions att ON att.id = sr.attention_id
                        """ + where + """
                        GROUP BY sr.status
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("status"))
                .label(rs.getString("status"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private List<ReportSeriesPoint> attentionTimeline(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildAttentionWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT DATE(ca.visit_date) AS bucket_date,
                               COUNT(*) AS qty
                        FROM clinical_attention ca
                        JOIN attentions att ON att.id = ca.attention_id
                        """ + where + """
                        GROUP BY DATE(ca.visit_date)
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

    private int countLabRequests(ReportFilters filters, String status) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildLabWhere(filters, params);
        params.addValue("labTargetStatus", status);
        Integer qty = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM laboratory_requests lr
                JOIN clinical_attention ca ON ca.id = lr.clinical_attention_id
                JOIN attentions att ON att.id = ca.attention_id
                """ + where + " AND lr.status = :labTargetStatus", params, Integer.class);
        return qty == null ? 0 : qty;
    }

    private int countSurgeries(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildSurgeryWhere(filters, params);
        Integer qty = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM surgical_reports sr
                JOIN attentions att ON att.id = sr.attention_id
                """ + where + " AND sr.status IN ('DRAFT','IN_PROGRESS','READY_TO_BILL')", params, Integer.class);
        return qty == null ? 0 : qty;
    }

    private String buildAttentionWhere(ReportFilters filters, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendDateRange(where, params, "ca.visit_date", filters, "clinicFrom", "clinicTo");
        ReportSqlHelper.appendStatusesFilter(where, params, "ca.status", filters.getStatuses(), "clinicStatuses");
        ReportSqlHelper.appendIdsFilter(where, params, "att.branch_id", filters.getBranchIds(), "clinicBranches");
        ReportSqlHelper.appendIdsFilter(where, params, "att.animal_id", filters.getAnimalIds(), "clinicAnimals");
        if (!filters.getEmployeeIds().isEmpty()) {
            where.append(" AND att.attending_employee_id IN (:clinicEmployees)");
            params.addValue("clinicEmployees", filters.getEmployeeIds());
        }
        return where.toString();
    }

    private String buildLabWhere(ReportFilters filters, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendDateRange(where, params, "lr.created_at", filters, "labFrom", "labTo");
        ReportSqlHelper.appendStatusesFilter(where, params, "lr.status", filters.getStatuses(), "labStatuses");
        ReportSqlHelper.appendIdsFilter(where, params, "att.branch_id", filters.getBranchIds(), "labBranches");
        ReportSqlHelper.appendIdsFilter(where, params, "lr.animal_id", filters.getAnimalIds(), "labAnimals");
        if (!filters.getEmployeeIds().isEmpty()) {
            where.append(" AND att.attending_employee_id IN (:labEmployees)");
            params.addValue("labEmployees", filters.getEmployeeIds());
        }
        return where.toString();
    }

    private String buildSurgeryWhere(ReportFilters filters, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendDateRange(where, params, "COALESCE(sr.surgery_start_at, att.check_in_time)", filters, "surgeryFrom", "surgeryTo");
        ReportSqlHelper.appendStatusesFilter(where, params, "sr.status", filters.getStatuses(), "surgeryStatuses");
        ReportSqlHelper.appendIdsFilter(where, params, "att.branch_id", filters.getBranchIds(), "surgeryBranches");
        if (!filters.getEmployeeIds().isEmpty()) {
            where.append(" AND att.attending_employee_id IN (:surgeryEmployees)");
            params.addValue("surgeryEmployees", filters.getEmployeeIds());
        }
        return where.toString();
    }
}
