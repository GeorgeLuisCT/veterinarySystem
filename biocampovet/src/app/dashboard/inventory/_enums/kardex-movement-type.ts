export enum KardexMovementType {
  PURCHASE_ENTRY = "PURCHASE_ENTRY",
  SALE_EXIT = "SALE_EXIT",
  SERVICE_EXIT = "SERVICE_EXIT",
  ADJUSTMENT_ENTRY = "ADJUSTMENT_ENTRY",
  ADJUSTMENT_EXIT = "ADJUSTMENT_EXIT",
  TRANSFER_ENTRY = "TRANSFER_ENTRY",
  TRANSFER_EXIT = "TRANSFER_EXIT",
}

export const KardexMovementTypeLabels: Record<KardexMovementType, string> = {
  [KardexMovementType.PURCHASE_ENTRY]: "Compra (entrada)",
  [KardexMovementType.SALE_EXIT]: "Venta (salida)",
  [KardexMovementType.SERVICE_EXIT]: "Servicio (salida)",
  [KardexMovementType.ADJUSTMENT_ENTRY]: "Ajuste (entrada)",
  [KardexMovementType.ADJUSTMENT_EXIT]: "Ajuste (salida)",
  [KardexMovementType.TRANSFER_ENTRY]: "Transferencia (entrada)",
  [KardexMovementType.TRANSFER_EXIT]: "Transferencia (salida)",
};
