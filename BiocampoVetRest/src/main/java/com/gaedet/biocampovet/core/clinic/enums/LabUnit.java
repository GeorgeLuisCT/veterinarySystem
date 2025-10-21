package com.gaedet.biocampovet.core.clinic.enums;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

import java.util.Optional;

@Getter
public enum LabUnit {
    NONE(""),
    PERCENT("%"),
    G_PER_DL("g/dL"),
    MG_PER_DL("mg/dL"),
    UG_PER_DL("µg/dL"),
    NG_PER_ML("ng/mL"),
    MMOL_PER_L("mmol/L"),
    MOL_PER_L("mol/L"),
    U_PER_L("U/L"),
    IU_PER_L("IU/L"),
    K_U_PER_L("kU/L"),
    X10_3_PER_UL("x10^3/µL"),
    X10_6_PER_UL("x10^6/µL"),
    CELLS_PER_UL("cél/µL"),
    PLATELETS_PER_UL("plt/µL"),
    FL("%fL"),            // volumen corpuscular medio (fL)
    PG("pg"),             // hemoglobina corpuscular media (pg)
    G_PER_L("g/L"),
    MG_PER_L("mg/L"),
    UMOL_PER_L("µmol/L"),
    MS("ms"),             // ejemplo electrofisiología
    SEC("s"),
    MIN("min");

    private final String symbol;

    LabUnit(String symbol) {
        this.symbol = symbol;
    }

    @JsonValue
    public String getCode() {
        return name();
    }

    @JsonIgnore
    public String getSymbol() {
        return symbol;
    }

    public static Optional<LabUnit> fromSymbol(String symbol) {
        if (symbol == null) return Optional.empty();
        for (LabUnit u : values()) {
            if (u.symbol.equalsIgnoreCase(symbol.trim())) return Optional.of(u);
        }
        return Optional.empty();
    }
}
