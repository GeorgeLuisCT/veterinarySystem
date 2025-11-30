package com.gaedet.biocampovet.core.clinic.enums;

import lombok.Getter;

@Getter
public enum FrequencyUnit {
    MINUTES("Minutos", "min"),
    HOURS("Horas", "h"),
    DAYS("Días", "d");

    private final String label;
    private final String abbreviation;

    FrequencyUnit(String label, String abbreviation) {
        this.label = label;
        this.abbreviation = abbreviation;
    }
}
