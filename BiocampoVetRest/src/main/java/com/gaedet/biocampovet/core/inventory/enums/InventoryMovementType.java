package com.gaedet.biocampovet.core.inventory.enums;

public enum InventoryMovementType {
    PURCHASE,
    POSITIVE_ADJUSTMENT,
    TRANSFER_RECEIVED,
    SUPPLIER_RETURN,
    NEGATIVE_ADJUSTMENT,
    TRANSFER_SENT,
    SALE,
    RETURN_SALE,
    CANCELLED_SALE;

    public boolean isIngreso() {
        return switch (this) {
            case PURCHASE, POSITIVE_ADJUSTMENT, TRANSFER_RECEIVED, RETURN_SALE, CANCELLED_SALE -> true;
            default -> false;
        };
    }

    public boolean isSalida() {
        return switch (this) {
            case SALE, SUPPLIER_RETURN, NEGATIVE_ADJUSTMENT, TRANSFER_SENT -> true;
            default -> false;
        };
    }

    public boolean isTransfer() {
        return this == TRANSFER_SENT || this == TRANSFER_RECEIVED;
    }
}

