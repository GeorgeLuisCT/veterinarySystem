import { TimeUnit } from "@/enums/time-unit";
import { BranchStateResponse } from "../../branche/types/branch-state-response";
import { ClinicalServiceCategory } from "../enums/clinical-service-category";

export interface ClinicalServiceSummaryResponse {
  id: number;
  name: string;
  description?: string | null;
  clinicalServiceCategory: ClinicalServiceCategory;
  price: number;
  branches: BranchStateResponse[];
}

export interface ClinicalServiceResponse extends ClinicalServiceSummaryResponse {
  reminderPeriod: number | null;
  reminderPeriodUnit: TimeUnit | null;
  requiredSampleTypes: string[];
  requiredProducts: ClinicalServiceRequiredProductResponse[];
}

export interface ClinicalServiceListParams {
  page?: number;
  size?: number;
  q?: string;
  category?: ClinicalServiceCategory;
}

export interface ClinicalServiceRequiredProductResponse {
  id: number;
  name: string;
  sku: string;
}

export interface ClinicalServiceQuickSearchResponse {
  id: number;
  name: string;
  clinicalServiceCategory: ClinicalServiceCategory;
  price: number | null;
}
