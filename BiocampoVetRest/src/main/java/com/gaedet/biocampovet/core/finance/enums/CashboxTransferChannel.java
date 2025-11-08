package com.gaedet.biocampovet.core.finance.enums;

import com.gaedet.biocampovet.core.sales.enums.PaymentMethod;

public enum CashboxTransferChannel {
    CASH,
    YAPE,
    PLIN,
    CARD,
    OTHER;

    public static CashboxTransferChannel fromPaymentMethod(PaymentMethod method) {
        if (method == null) {
            return null;
        }
        return switch (method) {
            case CASH -> CASH;
            case CREDIT_CARD, DEBIT_CARD -> CARD;
            case YAPE -> YAPE;
            case PLIN -> PLIN;
            default -> OTHER;
        };
    }
}
