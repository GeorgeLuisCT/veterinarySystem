package com.gaedet.veterinarysystem.core.inventory.enums;

import lombok.Getter;

@Getter
public enum ProductUnitType {
    KILOGRAM("Kilogramo", "kg."),
    GRAM("Gramo", "g."),
    MILLIGRAM("Miligramo", "mg."),
    MICROGRAM("Microgramo", "µg."),
    LITER("Litro", "L."),
    MILLILITER("Mililitro", "mL."),
    UNIT("Unidad", "Ud."),
    CAPSULE("Cápsula", "Cap."),
    TABLET("Tableta", "Tab."),
    PACK("Paquete", "Pq."),
    BOX("Caja", "Cj.");

    private final String label;
    private final String abbreviation;

    ProductUnitType(String label, String abbreviation) {
        this.label = label;
        this.abbreviation = abbreviation;
    }

    public boolean isFracionable() {
        return switch (this) {
            case KILOGRAM, GRAM, MILLIGRAM, MICROGRAM, LITER, MILLILITER -> true;
            default -> false;
        };
    }
}
