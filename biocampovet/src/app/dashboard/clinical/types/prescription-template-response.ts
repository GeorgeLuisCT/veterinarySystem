import { ProductUnitType } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { FrequencyUnit } from "../enums/frequency-unit";
import { TimeUnit } from "@/enums/time-unit";

export interface PrescriptionTemplateMedicationResponse {
  id: number;
  productId?: number | null;
  productName?: string | null;
  customMedicationName?: string | null;
  dosageAmount: number;
  dosageUnit?: ProductUnitType | null;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  durationValue: number;
  durationUnit: TimeUnit;
  instructions?: string | null;
}

export interface PrescriptionTemplateResponse {
  id: number;
  name: string;
  purpose: string;
  notes?: string | null;
  medications: PrescriptionTemplateMedicationResponse[];
}

export interface PrescriptionTemplateSummaryResponse {
  id: number;
  name: string;
  purpose: string;
  medicationCount: number;
}

export interface PrescriptionTemplateListParams {
  page?: number;
  size?: number;
  q?: string;
}