package com.gaedet.veterinarysystem.core.reports.service;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;

import java.util.Collection;
import java.util.Set;

public final class ReportSqlHelper {

    private ReportSqlHelper() {
    }

    public static void appendDateRange(StringBuilder sql,
                                       MapSqlParameterSource params,
                                       String columnName,
                                       ReportFilters filters,
                                       String fromParam,
                                       String toParam) {
        if (filters.getFrom() != null) {
            sql.append(" AND ").append(columnName).append(" >= :").append(fromParam);
            params.addValue(fromParam, filters.getFrom());
        }
        if (filters.getTo() != null) {
            sql.append(" AND ").append(columnName).append(" <= :").append(toParam);
            params.addValue(toParam, filters.getTo());
        }
    }

    public static void appendIdsFilter(StringBuilder sql,
                                       MapSqlParameterSource params,
                                       String columnName,
                                       Set<Long> ids,
                                       String paramName) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        sql.append(" AND ").append(columnName).append(" IN (:").append(paramName).append(")");
        params.addValue(paramName, ids);
    }

    public static void appendStatusesFilter(StringBuilder sql,
                                            MapSqlParameterSource params,
                                            String columnName,
                                            Set<String> statuses,
                                            String paramName) {
        if (statuses == null || statuses.isEmpty()) {
            return;
        }
        sql.append(" AND ").append(columnName).append(" IN (:").append(paramName).append(")");
        params.addValue(paramName, statuses);
    }

    public static void appendSearch(StringBuilder sql,
                                    MapSqlParameterSource params,
                                    String expression,
                                    String paramName,
                                    String search) {
        if (search == null || search.isBlank()) {
            return;
        }
        sql.append(" AND (").append(expression).append(")");
        params.addValue(paramName, "%" + search.toLowerCase() + "%");
    }

    public static void appendInClause(StringBuilder sql,
                                      MapSqlParameterSource params,
                                      String columnName,
                                      Collection<?> values,
                                      String paramName) {
        if (values == null || values.isEmpty()) {
            return;
        }
        sql.append(" AND ").append(columnName).append(" IN (:").append(paramName).append(")");
        params.addValue(paramName, values);
    }
}
