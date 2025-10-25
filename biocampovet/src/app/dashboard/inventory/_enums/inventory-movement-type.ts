export enum InventoryMovementType {
  PURCHASE = "PURCHASE",
  POSITIVE_ADJUSTMENT = "POSITIVE_ADJUSTMENT",
  TRANSFER_RECEIVED = "TRANSFER_RECEIVED",
  SUPPLIER_RETURN = "SUPPLIER_RETURN",
  NEGATIVE_ADJUSTMENT = "NEGATIVE_ADJUSTMENT",
  TRANSFER_SENT = "TRANSFER_SENT",
}

export const InventoryMovementTypeLabels: Record<InventoryMovementType, string> = {
  [InventoryMovementType.PURCHASE]: "Compra",
  [InventoryMovementType.POSITIVE_ADJUSTMENT]: "Ajuste positivo",
  [InventoryMovementType.TRANSFER_RECEIVED]: "Transferencia recibida",
  [InventoryMovementType.SUPPLIER_RETURN]: "Devolución a proveedor",
  [InventoryMovementType.NEGATIVE_ADJUSTMENT]: "Ajuste negativo",
  [InventoryMovementType.TRANSFER_SENT]: "Transferencia enviada",
};
