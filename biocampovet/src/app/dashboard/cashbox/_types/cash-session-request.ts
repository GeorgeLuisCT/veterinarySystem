import { PaymentMethod } from "../../pos/_types/sale-enums";
import { CashMovementType } from "./cash-session-enums";

export interface OpenCashSessionRequest {
  branchId: number;
  cashierId: number;
  openingAmount: number;
}

export interface CloseCashSessionRequest {
  countedClosingAmount: number;
  notes?: string;
  paymentTransfers: CashboxTransferAllocation[];
}

export interface CashboxTransferAllocation {
  paymentMethod: PaymentMethod;
  treasuryAccountId: number;
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
  cashierId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}