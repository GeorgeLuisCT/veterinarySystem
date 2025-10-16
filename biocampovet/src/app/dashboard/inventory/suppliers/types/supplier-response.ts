import { SupplierType } from "../enums/supplier-type";

export interface SupplierResponse {
  id: number;
  name: string;
  ruc: string;
  address?: string;
  website?: string;
  contactPhone?: string;
  email?: string;
  supplierType: SupplierType;
  bankAccountNumber?: string;
  bankName?: string;
  active: boolean;
}
