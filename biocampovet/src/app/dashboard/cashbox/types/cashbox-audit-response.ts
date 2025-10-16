import { UserSummaryResponse } from "../../security/users/types/user-summary-response";
import { CashBoxAuditPaymentMethodResponse } from "./cash-box-audit-payment-method-response";

export interface CashBoxAuditResponse {
  id: number;
  isFinal: boolean;
  observations: string;
  auditedBy: UserSummaryResponse;
  auditedAt: string;
  paymentMethodAudits: CashBoxAuditPaymentMethodResponse[];
}