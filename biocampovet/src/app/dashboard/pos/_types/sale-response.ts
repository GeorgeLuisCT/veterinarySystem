import { ProductUnitType } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { BillableServiceType, PaymentMethod, SaleStatus, SalesDocumentType } from "./sale-enums";

export interface SaleDetailResponse {
  id: number;
  description: string;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
  taxRate?: number;
  taxAmount?: number;
  productId?: number;
  productBatchId?: number;
  saleModeId?: number;
  unitType?: ProductUnitType;
  quantityEquivalent?: number;
  serviceType?: BillableServiceType;
  serviceItemId?: number;
  metadataJson?: string;
}

export interface SalePaymentResponse {
  id: number;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  reference?: string;
  notes?: string;
  cashSessionId?: number;
}

export interface SaleResponse {
  id: number;
  branchId: number;
  sellerId: number;
  customerId?: number;
  status: SaleStatus;
  documentType: SalesDocumentType;
  documentNumber: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
  voidReason?: string;
  sourceAttentionId?: number;
  notes?: string;
  details: SaleDetailResponse[];
  payments: SalePaymentResponse[];
}

export interface SaleSummaryResponse {
  id: number;
  documentType: SalesDocumentType;
  documentNumber: string;
  status: SaleStatus;
  grandTotal: number;
  createdAt: string;
  branchId: number;
  sellerId: number;
  customerId?: number;
}
