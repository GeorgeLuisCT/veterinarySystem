import { SupplierType } from "../_enums/supplier-type";

export interface SupplierListParams {
  page?: number;
  size?: number;
  active?: boolean;
  supplierType?: SupplierType;
  q?: string;
}

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

export interface SupplierSummaryResponse {
  id: number;
  name: string;
  ruc: string;
  contactPhone?: string;
  email?: string;
  supplierType: SupplierType;
  active: boolean;
}

export interface SupplierQuickSearchResponse {
  id: number;
  name: string;
  email: string;
}