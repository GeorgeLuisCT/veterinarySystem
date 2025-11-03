import { CashMovementType } from "./cash-session-enums";

export interface OpenCashSessionRequest {
  branchId: number;
  cashierId: number;
  openingAmount: number;
}

export interface CloseCashSessionRequest {
  countedClosingAmount: number;
  notes?: string;
}

export interface RegisterCashMovementRequest {
  movementType: CashMovementType;
  amount: number;
  reason: string;
  registeredById: number;
  reference?: string;
}

export interface CashSessionHistoryParams {
  branchId?: number;
  page?: number;
  size?: number;
}

