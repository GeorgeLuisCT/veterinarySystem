export enum PaymentType {
  SALE = "SALE",
  RESERVATION = "RESERVATION",
  ADVANCE = "ADVANCE",
  CREDIT_PAYMENT = "CREDIT_PAYMENT",
  RETURN_REFUND = "RETURN_REFUND",
  GENERAL_INCOME = "GENERAL_INCOME",
  OTHER = "OTHER",
}

export const PaymentTypeLabels: Record<PaymentType, string> = {
  [PaymentType.SALE]: "Venta",
  [PaymentType.RESERVATION]: "Reserva",
  [PaymentType.ADVANCE]: "Adelanto",
  [PaymentType.CREDIT_PAYMENT]: "Pago de crédito",
  [PaymentType.RETURN_REFUND]: "Reembolso",
  [PaymentType.GENERAL_INCOME]: "Ingreso general",
  [PaymentType.OTHER]: "Otro",
};
