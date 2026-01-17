package com.gaedet.veterinarysystem.core.inventory.enums;

public enum KardexMovementType {
    PURCHASE_ENTRY(false),
    SALE_EXIT(true),
    SERVICE_EXIT(true),
    ADJUSTMENT_ENTRY(false),
    ADJUSTMENT_EXIT(true),
    TRANSFER_ENTRY(false),
    TRANSFER_EXIT(true);

    private final boolean isExit;

    KardexMovementType(boolean isExit) {
        this.isExit = isExit;
    }

    public boolean isExit() {
        return this.isExit;
    }
}