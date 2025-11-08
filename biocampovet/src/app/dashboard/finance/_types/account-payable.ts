import { PaginatedResponse } from "@/types/paginated-response";

export enum AccountPayableStatus {
  PENDING = "PENDING",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
}

export interface AccountPayableSummary {
  id: number;
  supplierId?: number | null;
  supplierName?: string | null;
  description: string;
  issueDate: string;
  totalAmount: number;
  amountPaid: number;
  status: AccountPayableStatus;
}

export interface AccountPayablePaymentResponse {
  id: number;
  amount: number;
  paymentDate: string;
  treasuryAccountId: number;
  treasuryAccountName?: string | null;
  notes?: string | null;
}

export interface AccountPayableDetail extends AccountPayableSummary {
  payments: AccountPayablePaymentResponse[];
}

export type AccountPayablePage = PaginatedResponse<AccountPayableSummary>;
