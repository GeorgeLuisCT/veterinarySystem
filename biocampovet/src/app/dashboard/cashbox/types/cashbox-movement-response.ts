import { UserSummaryResponse } from "../../security/users/types/user-summary-response";
import { CashboxMovementReason } from "../enums/cashbox-movement-reason";
import { CashboxMovementType } from "../enums/cashbox-movement-type";

export interface CashboxMovementResponse {
  id: number;
  type: CashboxMovementType;
  reason: CashboxMovementReason;
  amount: number;
  description: string;
  documentReference: string;
  operationNumber: string;
  registeredBy: string;
  notes: string;
  registeredAt: string;
  userSummaryResponse: UserSummaryResponse;
}