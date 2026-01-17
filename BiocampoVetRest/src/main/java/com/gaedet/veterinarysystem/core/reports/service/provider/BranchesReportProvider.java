package com.gaedet.veterinarysystem.core.reports.service.provider;

import com.gaedet.veterinarysystem.core.reports.dto.KeyValuePair;
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

@Component
public class BranchesReportProvider extends AbstractJdbcReportProvider {

    public BranchesReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.BRANCHES;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        Integer totalBranches = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM branches", new MapSqlParameterSource(), Integer.class);
        Integer labs = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM laboratories", new MapSqlParameterSource(), Integer.class);
        Integer operatingRooms = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM operating_rooms", new MapSqlParameterSource(), Integer.class);

        int total = totalBranches == null ? 0 : totalBranches;
        int labCount = labs == null ? 0 : labs;
        int orCount = operatingRooms == null ? 0 : operatingRooms;

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("branches")
                        .label("Sedes registradas")
                        .value((double) total)
                        .formattedValue(String.valueOf(total))
                        .unit("sedes")
                        .build(),
                ReportMetric.builder()
                        .key("labs")
                        .label("Laboratorios internos")
                        .value((double) labCount)
                        .formattedValue(String.valueOf(labCount))
                        .unit("laboratorios")
                        .build(),
                ReportMetric.builder()
                        .key("operating-rooms")
                        .label("Quirófanos equipados")
                        .value((double) orCount)
                        .formattedValue(String.valueOf(orCount))
                        .unit("quirófanos")
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Sedes")
                .description("Infraestructura disponible")
                .metrics(metrics)
                .breakdowns(List.of(
                        ReportBreakdownGroup.builder()
                                .key("branch-list")
                                .title("Sedes y ubicación")
                                .items(branchList(filters))
                                .build()
                ))
                .timeline(List.of())
                .build();
    }

    private List<ReportBreakdownItem> branchList(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder();
        if (!filters.getBranchIds().isEmpty()) {
            where.append(" WHERE b.id IN (:branchFilter)");
            params.addValue("branchFilter", filters.getBranchIds());
        }
        return jdbcTemplate.query("""
                        SELECT b.name, b.location, c.name AS company_name
                        FROM branches b
                        JOIN companies c ON c.id = b.company_id
                        """ + where + """
                        ORDER BY b.name
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("name"))
                .label(rs.getString("name"))
                .value(null)
                .formattedValue(rs.getString("location"))
                .metadata(List.of(
                        KeyValuePair.builder()
                                .key("Compañía")
                                .value(rs.getString("company_name"))
                                .build()
                ))
                .build());
    }
}
