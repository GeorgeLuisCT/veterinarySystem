package com.gaedet.biocampovet.core.sales.enums;

public enum SaleStatus {
    PENDING("Pendiente"),
    COMPLETED("Completado"),
    CANCELED("Cancelado");

    private final String label;

    SaleStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static SaleStatus fromLabel(String label) {
        for (SaleStatus status : values()) {
            if (status.label.equalsIgnoreCase(label)) {
                return status;
            }
        }
        throw new IllegalArgumentException("No enum constant with label " + label);
    }
}
