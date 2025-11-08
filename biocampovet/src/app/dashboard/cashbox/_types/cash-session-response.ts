import { CashMovementType, CashSessionStatus } from "./cash-session-enums";

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

