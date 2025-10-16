import { UserSummaryResponse } from "../../security/users/types/user-summary-response";
import { CashBoxStatus } from "../enums/cashbox-status";
import { CashBoxAuditResponse } from "./cashbox-audit-response";
import { CashboxMovementResponse } from "./cashbox-movement-response";
import { PaymentResponse } from "./payment-response";

export interface CashBoxResponse {
  id: number;
  branchName: string;
  openedBy: UserSummaryResponse;
  closedBy: UserSummaryResponse | null;
  initialAmount: number;
  openedAt: string;
  closedAt: string | null;
  status: CashBoxStatus;
  totalIncome: number;
  totalExpense: number;
  physicalAmount: number;
  closingObservations: string;
  payments: PaymentResponse[];
  movements: CashboxMovementResponse[];
  audits: CashBoxAuditResponse[];
}