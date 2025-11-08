import { CashMovementType } from "./cash-session-enums";
import { CashboxTransferChannel } from "@/app/dashboard/finance/_types/treasury-account";

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
  channel: CashboxTransferChannel;
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
  page?: number;
  size?: number;
}
