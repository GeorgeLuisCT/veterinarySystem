package com.gaedet.biocampovet.core.reports.service.provider;

import com.gaedet.biocampovet.core.reports.dto.ReportBreakdownGroup;
import com.gaedet.biocampovet.core.reports.dto.ReportBreakdownItem;
import com.gaedet.biocampovet.core.reports.dto.ReportCollection;
import com.gaedet.biocampovet.core.reports.dto.ReportMetric;
import com.gaedet.biocampovet.core.reports.enums.ReportModule;
import com.gaedet.biocampovet.core.reports.service.ReportFilters;
import com.gaedet.biocampovet.core.reports.service.ReportSqlHelper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class AnimalsReportProvider extends AbstractJdbcReportProvider {

    public AnimalsReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public ReportModule module() {
        return ReportModule.ANIMALS;
    }

    @Override
    public ReportCollection build(ReportFilters filters) {
        Map<String, Object> summary = summarizeAnimals(filters);

        Number totalNum = (Number) summary.get("total_animals");
        int total = (totalNum == null) ? 0 : totalNum.intValue();

        Number activeNum = (Number) summary.get("active_animals");
        int active = (activeNum == null) ? 0 : activeNum.intValue();

        Number avgAgeNum = (Number) summary.get("avg_age");
        double avgAge = (avgAgeNum == null) ? 0.0 : avgAgeNum.doubleValue();

        List<ReportMetric> metrics = List.of(
                ReportMetric.builder()
                        .key("total-animals")
                        .label("Pacientes registrados")
                        .value((double) total)
                        .formattedValue(String.valueOf(total))
                        .unit("pacientes")
                        .build(),
                ReportMetric.builder()
                        .key("active-animals")
                        .label("Pacientes activos")
                        .value((double) active)
                        .formattedValue(String.valueOf(active))
                        .unit("pacientes")
                        .build(),
                ReportMetric.builder()
                        .key("avg-age")
                        .label("Edad promedio")
                        .value(avgAge)
                        .formattedValue(String.format("%.1f años", avgAge))
                        .unit("años")
                        .build()
        );

        return ReportCollection.builder()
                .module(module())
                .title("Pacientes")
                .description("Composición de pacientes y propietarios")
                .metrics(metrics)
                .breakdowns(List.of(
                        ReportBreakdownGroup.builder()
                                .key("species")
                                .title("Distribución por especie")
                                .items(speciesBreakdown(filters))
                                .build(),
                        ReportBreakdownGroup.builder()
                                .key("owners")
                                .title("Propietarios con más mascotas activas")
                                .items(ownerBreakdown(filters))
                                .build()
                ))
                .timeline(List.of())
                .build();
    }

    private Map<String, Object> summarizeAnimals(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) AS total_animals,
                    SUM(CASE WHEN a.is_active THEN 1 ELSE 0 END) AS active_animals,
                    COALESCE(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.birth_date))), 0) AS avg_age
                FROM animal a
                """ + where, params);
    }

    private List<ReportBreakdownItem> speciesBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT a.species, COUNT(*) AS qty
                        FROM animal a
                        """ + where + """
                         GROUP BY a.species
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("species"))
                .label(rs.getString("species"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private List<ReportBreakdownItem> ownerBreakdown(ReportFilters filters) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filters, params);
        return jdbcTemplate.query("""
                        SELECT c.name AS owner,
                               COUNT(*) AS qty
                        FROM animal a
                        JOIN customer c ON c.id = a.customer_id
                        """ + where + """
                         GROUP BY c.name
                        ORDER BY qty DESC
                        LIMIT 5
                        """, params, (rs, rowNum) -> ReportBreakdownItem.builder()
                .key(rs.getString("owner"))
                .label(rs.getString("owner"))
                .value((double) rs.getInt("qty"))
                .formattedValue(String.valueOf(rs.getInt("qty")))
                .build());
    }

    private String buildWhere(ReportFilters filters, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        ReportSqlHelper.appendIdsFilter(where, params, "a.customer_id", filters.getCustomerIds(), "animalCustomers");
        ReportSqlHelper.appendIdsFilter(where, params, "a.id", filters.getAnimalIds(), "animalIds");
        if (filters.getSpecies() != null && !filters.getSpecies().isEmpty()) {
            ReportSqlHelper.appendInClause(where, params, "a.species", filters.getSpecies(), "animalSpecies");
        }
        return where.toString();
    }
}
