package com.gaedet.biocampovet.core.cash.enums;

public enum PaymentType {
    SALE,              // Pago relacionado a una venta
    RESERVATION,       // Pago por reserva de servicio o producto
    ADVANCE,           // Adelanto o abono a cuenta
    CREDIT_PAYMENT,    // Pago de crédito o deuda
    RETURN_REFUND,     // Reembolso por devolución
    GENERAL_INCOME,    // Ingreso general no vinculado a ventas
    OTHER              // Otro tipo de pago no clasificado
}

