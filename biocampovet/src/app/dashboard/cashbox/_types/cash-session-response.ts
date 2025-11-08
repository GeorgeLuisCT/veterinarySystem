import { CashMovementType, CashSessionStatus } from "./cash-session-enums";
import { CashboxTransferChannel } from "@/app/dashboard/finance/_types/treasury-account";

export interface CashMovementResponse {
  id: number;
  movementType: CashMovementType;
  amount: number;
  reason: string;
  registeredById?: number;
  registeredByName?: string;
  registeredAt: string;
  reference?: string;
}

export interface CashSessionSummaryResponse {
  id: number;
  branchId: number;
  branchName?: string;
  cashierId: number;
  cashierName?: string;
  status: CashSessionStatus;
  openedAt: string;
  closedAt?: string;
  openingAmount: number;
  totalCashSales: number;
  totalIncomeMovements: number;
  totalExpenseMovements: number;
  calculatedClosingAmount: number;
  countedClosingAmount?: number;
  differenceAmount?: number;
  notes?: string;
}

export interface CashSessionDetailResponse {
  open: boolean;
  session: CashSessionSummaryResponse | null;
  movements: CashMovementResponse[];
  paymentBreakdown: CashboxPaymentBreakdownResponse[];
}

export interface CashSessionHistoryResponse {
  id: number;
  branchId: number;
  branchName?: string;
  cashierId: number;
  cashierName?: string;
  openedAt: string;
  closedAt?: string;
  openingAmount: number;
  calculatedClosingAmount: number;
  countedClosingAmount?: number;
  differenceAmount?: number;
  notes?: string;
}

export interface CashboxPaymentBreakdownResponse {
  channel: CashboxTransferChannel;
  label: string;
  amount: number;
}
