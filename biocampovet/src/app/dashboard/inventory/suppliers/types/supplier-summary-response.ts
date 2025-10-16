import { SupplierType } from "../enums/supplier-type";

export interface SupplierSummaryResponse {
  id: number;
  name: string;
  ruc: string;
  contactPhone?: string;
  email?: string;
  supplierType: SupplierType;
  active: boolean;
}
