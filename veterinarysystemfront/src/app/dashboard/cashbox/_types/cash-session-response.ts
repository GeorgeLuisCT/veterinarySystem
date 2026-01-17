import { PaymentMethod } from "../../pos/_types/sale-enums";
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
  totalSales: number;
  totalIncomeMovements: number;
  totalExpenseMovements: number;
  calculatedClosingAmount: number;
  countedClosingAmount?: number;
  differenceAmount?: number;
  notes?: string;
}

export interface CashSessionSalePaymentResponse {
  paymentId: number;
  saleId: number;
  paidAt: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  customerName?: string;
  saleDocumentNumber?: string;
  saleGrandTotal: number;
}

export interface CashSessionDetailResponse {
  open: boolean;
  session: CashSessionSummaryResponse | null;
  movements: CashMovementResponse[];
  paymentBreakdown: CashboxPaymentBreakdownResponse[];
  salePayments: CashSessionSalePaymentResponse[];
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
  paymentMethod: PaymentMethod;
  label: string;
  amount: number;
}