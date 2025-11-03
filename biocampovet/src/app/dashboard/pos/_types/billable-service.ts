import { BillableServiceType } from "./sale-enums";

export interface BillableServiceItem {
  type: BillableServiceType;
  itemId: number;
  description: string;
  branchId?: number;
  unitPrice: number;
  quantity: number;
  taxRate?: number;
  metadataJson?: string;
}

export interface BillableServiceListParams {
  branchId?: number;
  attentionId?: number;
  patientId?: number;
  search?: string;
  pendingOnly?: boolean;
}

