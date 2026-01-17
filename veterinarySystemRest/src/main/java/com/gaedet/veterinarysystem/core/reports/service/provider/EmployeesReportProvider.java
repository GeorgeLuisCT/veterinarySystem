package com.gaedet.veterinarysystem.core.reports.service.provider;

import com.gaedet.veterinarysystem.core.reports.dto.ReportBreakdownGroup;
import com.gaedet.veterinarysystem.core.reports.dto.ReportBreakdownItem;
import com.gaedet.veterinarysystem.core.reports.dto.ReportCollection;
import com.gaedet.veterinarysystem.core.reports.dto.ReportMetric;
import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
import com.gaedet.veterinarysystem.core.reports.service.ReportFilters;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class EmployeesReportProvider extends AbstractJdbcReportProvider {

    public EmployeesReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.EMPLOYEES;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        Map<String, Object> summary = summarizeEmployees(filters);

        Number totalNum = (Number) summary.get("total_employees");
        int total = (totalNum == null) ? 0 : totalNum.intValue();

        Number fieldVetsNum = (Number) summary.get("field_vets");
        int fieldVets = (fieldVetsNum == null) ? 0 : fieldVetsNum.intValue();

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("total-staff")
                        .label("Colaboradores registrados")
                        .value((double) total)
                        .formattedValue(String.valueOf(total))
                        .unit("personas")
                        .build(),
                ReportMetric.builder()
                        .key("field-vets")
                        .label("Veterinarios de campo")
                        .value((double) fieldVets)
                        .formattedValue(String.valueOf(fieldVets))
                        .unit("personas")
                        .trend(total == 0 ? 0 : fieldVets / (double) total)
                        .trendLabel(total == 0 ? null : String.format("%.1f%%", 100 * fieldVets / (double) total))
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Talento humano")
                .description("Distribución y asignaciones")
                .metrics(metrics)
                .breakdowns(List.of(
                        ReportBreakdownGroup.builder()
                                .key("burdens")
                                .title("Cargos")
                                .items(burdenBreakdown(filters))
                                .build(),
                        ReportBreakdownGroup.builder()
                                .key("branches")
                                .title("Cobertura por sede")
                                .items(branchBreakdown(filters))
                                .build()
                ))
                .timeline(List.of())
                .build();
    }

    private Map<String, Object> summarizeEmployees(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = buildEmployeeFilter(filters, params);
        return jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) AS total_employees,
                    SUM(CASE WHEN e.is_field_vet THEN 1 ELSE 0 END) AS field_vets
                FROM employees e
                """ + where, params);
    }

    private List<ReportBreakdownItem> burdenBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = buildEmployeeFilter(filters, params);
        return jdbcTemplate.query("""
                        SELECT e.burden, COUNT(*) AS qty
                        FROM employees e
                        """ + where + """
                         GROUP BY e.burden
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("burden"))
                .label(rs.getString("burden"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private List<ReportBreakdownItem> branchBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE eb.active = true");
        if (filters.getBranchIds() != null && !filters.getBranchIds().isEmpty()) {
            where.append(" AND eb.branch_id IN (:empBranches)");
            params.addValue("empBranches", filters.getBranchIds());
        }
        return jdbcTemplate.query("""
                        SELECT b.name AS branch_name,
                               COUNT(DISTINCT eb.employee_id) AS qty
                        FROM employee_branch eb
                        JOIN branches b ON b.id = eb.branch_id
                        """ + where + """
                         GROUP BY b.name
                        ORDER BY qty DESC
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("branch_name"))
                .label(rs.getString("branch_name"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private StringBuilder buildEmployeeFilter(ReportFilters filters, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        if (filters.getEmployeeIds() != null && !filters.getEmployeeIds().isEmpty()) {
            where.append(" AND e.id IN (:empIds)");
            params.addValue("empIds", filters.getEmployeeIds());
        }
        if (filters.getBranchIds() != null && !filters.getBranchIds().isEmpty()) {
            where.append("""
                     AND EXISTS (
                        SELECT 1 FROM employee_branch eb2
                        WHERE eb2.employee_id = e.id
                        AND eb2.branch_id IN (:empFilterBranches)
                        AND eb2.active = true
                    )
                    """);
            params.addValue("empFilterBranches", filters.getBranchIds());
        }
        return where;
    }
}