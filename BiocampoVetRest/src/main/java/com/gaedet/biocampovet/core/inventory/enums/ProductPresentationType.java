package com.gaedet.biocampovet.core.inventory.enums;

import lombok.Getter;

@Getter
public enum ProductPresentationType {
    BOTTLE("Botella"),
    BAG("Bolsa"),
    BOX("Caja"),
    JAR("Frasco"),
    SACHET("Sobre"),
    BLISTER("Blíster"),
    CAN("Lata"),
    TUBE("Tubo"),
    PACK("Paquete"),
    AMPOULE("Ampolla"),
    SYRINGE("Jeringa precargada"),
    GALLON("Galón"),
    CASE("Estuche"),
    ROLL("Rollo"),
    LOOSE("Suelto"),
    NONE("Ninguno");

    private final String label;

    ProductPresentationType(String label) {
        this.label = label;
    }
}