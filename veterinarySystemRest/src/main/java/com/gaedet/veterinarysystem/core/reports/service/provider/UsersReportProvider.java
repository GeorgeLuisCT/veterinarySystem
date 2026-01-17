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
public class UsersReportProvider extends AbstractJdbcReportProvider {

    public UsersReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.USERS;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        Map<String, Object> summary = jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) AS total_users,
                    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_users
                FROM users
                """, new MapSqlParameterSource());

        int total = ((Number) summary.getOrDefault("total_users", 0)).intValue();
        int active = ((Number) summary.getOrDefault("active_users", 0)).intValue();

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("total-users")
                        .label("Usuarios registrados")
                        .value((double) total)
                        .formattedValue(String.valueOf(total))
                        .unit("usuarios")
                        .build(),
                ReportMetric.builder()
                        .key("active-users")
                        .label("Usuarios activos")
                        .value((double) active)
                        .formattedValue(String.valueOf(active))
                        .unit("usuarios")
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Usuarios")
                .description("Accesos y roles del sistema")
                .metrics(metrics)
                .breakdowns(List.of(
                        ReportBreakdownGroup.builder()
                                .key("roles")
                                .title("Distribución por rol")
                                .items(roleBreakdown())
                                .build()
                ))
                .timeline(List.of())
                .build();
    }

    private List<ReportBreakdownItem> roleBreakdown() {
        return jdbcTemplate.query("""
                        SELECT r.name AS role_name,
                               COUNT(*) AS qty
                        FROM users u
                        JOIN user_roles ur ON ur.user_id = u.id
                        JOIN roles r ON r.id = ur.role_id
                        GROUP BY r.name
                        ORDER BY qty DESC
                        """, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("role_name"))
                .label(rs.getString("role_name"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }
}
