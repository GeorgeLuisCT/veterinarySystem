export enum CashboxMovementType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export const CashboxMovementTypeLabels: Record<CashboxMovementType, string> = {
  [CashboxMovementType.INCOME]: "Ingreso",
  [CashboxMovementType.EXPENSE]: "Egreso",
};
