import { ProductUnitType } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { BillableServiceType, PaymentMethod, SaleItemKind, SaleStatus, SalesDocumentType } from "./sale-enums";

export interface SaleItemRequest {
  kind: SaleItemKind;
  productId?: number;
  productBatchId?: number;
  saleModeId?: number;
  serviceType?: BillableServiceType;
  serviceItemId?: number;
  unitPrice: number;
  quantity: number;
  unitType?: ProductUnitType;
  taxRate?: number;
  taxAmount?: number;
  descriptionOverride?: string;
  metadataJson?: string;
}

export interface SalePaymentRequest {
  amount: number;
  method: PaymentMethod;
  paidAt?: string;
  reference?: string;
  notes?: string;
}

export interface CreateSaleRequest {
  saleId?: number;
  finalizeSale?: boolean;
  branchId: number;
  sellerId: number;
  customerId?: number;
  documentType: SalesDocumentType;
  documentNumber: string;
  items: SaleItemRequest[];
  payments?: SalePaymentRequest[];
  notes?: string;
}

export interface VoidSaleRequest {
  reason: string;
}

export interface SaleListParams {
  page?: number;
  size?: number;
  branchId?: number;
  status?: SaleStatus;
  documentNumber?: string;
}
