import { PaymentType } from "../enums/payment-type";

export interface PaymentResponse {
  id: number;
  paymentType: PaymentType;
  method: string;
  amount: number;
  description: string;
  operationNumber: string;
  documentReference: string;
  receivedBy: string;
  paidAt: string;
  notes: string;
}