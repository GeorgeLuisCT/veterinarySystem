import { AccountMovementResponse } from "./treasury-account";

export interface ExpenseRequest {
  treasuryAccountId: number;
  description: string;
  amount: number;
  occurredAt?: string;
}

export interface TransferRequest {
  sourceAccountId: number;
  targetAccountId: number;
  amount: number;
  description?: string;
  occurredAt?: string;
}

export interface TransferResponse {
  sourceMovement: AccountMovementResponse;
  destinationMovement: AccountMovementResponse;
}
