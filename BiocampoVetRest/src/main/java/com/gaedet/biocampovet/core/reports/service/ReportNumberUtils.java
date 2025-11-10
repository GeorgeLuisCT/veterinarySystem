package com.gaedet.biocampovet.core.reports.service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

public final class ReportNumberUtils {

    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(new Locale("es", "PE"));
    private static final NumberFormat PERCENT_FORMAT = NumberFormat.getPercentInstance(new Locale("es", "PE"));

    static {
        PERCENT_FORMAT.setMinimumFractionDigits(1);
        PERCENT_FORMAT.setMaximumFractionDigits(1);
        CURRENCY_FORMAT.setMaximumFractionDigits(2);
        CURRENCY_FORMAT.setMinimumFractionDigits(2);
    }

    private ReportNumberUtils() {
    }

    public static double toDouble(BigDecimal value) {
        if (value == null) {
            return 0d;
        }
        return value.doubleValue();
    }

    public static String currency(BigDecimal value) {
        return CURRENCY_FORMAT.format(value == null ? BigDecimal.ZERO : value);
    }

    public static String percentage(Double value) {
        if (value == null) {
            return null;
        }
        return PERCENT_FORMAT.format(value);
    }
}
