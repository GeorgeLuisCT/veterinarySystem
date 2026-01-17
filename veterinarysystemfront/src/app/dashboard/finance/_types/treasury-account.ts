import { PaginatedResponse } from "@/types/paginated-response";
import { AccountMovementType, TreasuryAccountType } from "../_enums/accounts-enums";

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
