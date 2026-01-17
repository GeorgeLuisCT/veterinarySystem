package com.gaedet.veterinarysystem.core.sales.enums;

public enum SalesDocumentType {

    BOLETA("Boleta"),
    FACTURA("Factura"),
    NOTA_VENTA("Nota de Venta"),
    NONE("Sin Documento");

    private final String label;

    SalesDocumentType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}