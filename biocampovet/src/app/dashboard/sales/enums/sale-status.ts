export enum SaleStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
}

export const SaleStatusLabels: Record<SaleStatus, string> = {
  [SaleStatus.PENDING]: "Pendiente",
  [SaleStatus.COMPLETED]: "Completado",
  [SaleStatus.CANCELED]: "Cancelado",
};
