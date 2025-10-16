export enum CashboxMovementReason {
  SUPPLIER_PAYMENT = "SUPPLIER_PAYMENT",
  MEDICINE_PURCHASE = "MEDICINE_PURCHASE",
  REIMBURSEMENT = "REIMBURSEMENT",
  DONATION = "DONATION",
  OPERATING_COST = "OPERATING_COST",
  OTHER = "OTHER",
}

export const CashboxMovementReasonLabels: Record<CashboxMovementReason, string> = {
  [CashboxMovementReason.SUPPLIER_PAYMENT]: "Pago a proveedor",
  [CashboxMovementReason.MEDICINE_PURCHASE]: "Compra de medicamentos",
  [CashboxMovementReason.REIMBURSEMENT]: "Reembolso",
  [CashboxMovementReason.DONATION]: "Donación",
  [CashboxMovementReason.OPERATING_COST]: "Costo operativo",
  [CashboxMovementReason.OTHER]: "Otro",
};
