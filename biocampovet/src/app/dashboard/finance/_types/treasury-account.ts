import { PaginatedResponse } from "@/types/paginated-response";

export enum TreasuryAccountType {
  BANK = "BANK",
  CASH = "CASH",
  DIGITAL = "DIGITAL",
}

export enum AccountMovementType {
  CASHBOX_CLOSING = "CASHBOX_CLOSING",
  SUPPLIER_PAYMENT = "SUPPLIER_PAYMENT",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
  MANUAL_ENTRY = "MANUAL_ENTRY",
}

export enum CashboxTransferChannel {
  CASH = "CASH",
  YAPE = "YAPE",
  PLIN = "PLIN",
  CARD = "CARD",
  OTHER = "OTHER",
}

export interface TreasuryAccountResponse {
  id: number;
  name: string;
  type: TreasuryAccountType;
  description?: string | null;
  active: boolean;
  currentBalance: number;
}

export interface AccountMovementResponse {
  id: number;
  treasuryAccountId: number;
  treasuryAccountName: string;
  movementDate: string;
  amount: number;
  description?: string | null;
  movementType: AccountMovementType;
  reference?: string | null;
}

export type AccountMovementPage = PaginatedResponse<AccountMovementResponse>;
