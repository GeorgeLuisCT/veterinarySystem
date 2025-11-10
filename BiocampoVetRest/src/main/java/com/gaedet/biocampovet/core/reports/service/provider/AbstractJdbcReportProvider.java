package com.gaedet.biocampovet.core.reports.service.provider;

import com.gaedet.biocampovet.core.reports.service.ReportDataProvider;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.math.BigDecimal;

public abstract class AbstractJdbcReportProvider implements ReportDataProvider {

    protected final NamedParameterJdbcTemplate jdbcTemplate;

    protected AbstractJdbcReportProvider(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    protected double asDouble(Number value) {
        return value == null ? 0d : value.doubleValue();
    }

    protected BigDecimal asBigDecimal(Number value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        return BigDecimal.valueOf(value.doubleValue());
    }

    protected String asString(Object value) {
        return value == null ? null : value.toString();
    }
}
