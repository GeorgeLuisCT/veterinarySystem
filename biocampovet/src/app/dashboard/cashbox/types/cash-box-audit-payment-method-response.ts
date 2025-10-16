import { PaymentMethodResponse } from "./payment-method-response";

export interface CashBoxAuditPaymentMethodResponse {
  paymentMethod: PaymentMethodResponse;
  expectedAmount: number;
  countedAmount: number;
}
