package com.gaedet.veterinarysystem.core.sales.enums;

public enum PaymentMethod {

    CASH("Efectivo"),
    CREDIT_CARD("Tarjeta de Crédito"),
    DEBIT_CARD("Tarjeta de Débito"),
    YAPE("Yape"),
    PLIN("Plin"),
    BANK_TRANSFER("Transferencia Bancaria"),
    MOBILE_PAYMENT("Pago Móvil"),
    CHECK("Cheque"),
    OTHER("Otros");

    private final String label;

    PaymentMethod(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}