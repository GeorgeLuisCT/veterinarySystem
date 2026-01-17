export enum InventoryMovementType {
  PURCHASE = "PURCHASE",
  TRANSFER = "TRANSFER",
  ADJUSTMENT = "ADJUSTMENT",
  SALE = "SALE",
  SERVICE = "SERVICE",
}

export const InventoryMovementTypeLabels: Record<InventoryMovementType, string> = {
  [InventoryMovementType.PURCHASE]: "Compra",
  [InventoryMovementType.TRANSFER]: "Transferencia",
  [InventoryMovementType.ADJUSTMENT]: "Ajuste",
  [InventoryMovementType.SALE]: "Venta",
  [InventoryMovementType.SERVICE]: "Servicio",
};
