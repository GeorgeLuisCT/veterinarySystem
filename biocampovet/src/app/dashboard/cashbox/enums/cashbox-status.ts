export enum CashBoxStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export const CashBoxStatusLabels: Record<CashBoxStatus, string> = {
  [CashBoxStatus.OPEN]: "Abierta",
  [CashBoxStatus.CLOSED]: "Cerrada",
};
