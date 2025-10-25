package com.gaedet.biocampovet.core.inventory.enums;

public enum InventoryMovementType {
    PURCHASE,  // Compra
    TRANSFER,  // Transferencia
    ADJUSTMENT, // Ajuste
    SALE,       // Venta (lo usarás desde tu servicio de ventas)
    SERVICE     // Uso en servicio (lo usarás desde tu servicio de atenciones)
}

