import { HospitalizationStatus } from "../enums/hospitalization-status";
import { AdmissionTiming } from "../enums/admission-timing";
import { HospitalizationCause } from "../enums/hospitalization-cause";
import { ProductUnitType } from "@/app/dashboard/inventory/_enums/product-unit-type";

export interface HospitalizationSummaryResponse {
  id: number;
  animalId: number;
  animalName: string;
  cageId: number;
  cageName: string;
  branchId: number;
  branchName: string;
  admissionDate: string;
  status: HospitalizationStatus;
  admissionTiming: AdmissionTiming;
  cause?: HospitalizationCause | null;
  clinicalServiceId?: number | null;
  clinicalServiceName?: string | null;
  version: number;
}

export interface EvolutionNoteResponse {
  id: number;
  hospitalizationId: number;
  authorId: number;
  authorFullName: string;
  timestamp: string;
  note: string;
}

export interface TreatmentScheduleProductUsageResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unit: ProductUnitType;
}

export interface TreatmentScheduleResponse {
  id: number;
  hospitalizationId: number;
  treatmentName: string;
  scheduledTime: string;
  isCompleted: boolean;
  completedAt?: string;
  completedByEmployeeId?: number;
  completedByEmployeeFullName?: string;
  notes?: string;
  products?: TreatmentScheduleProductUsageResponse[];
}

export interface HospitalizationVitalSignResponse {
  id: number;
  hospitalizationId: number;
  weightKg?: number;
  temperatureCelsius?: number;
  heartRate?: number;
  respiratoryRate?: number;
  recordedAt: string;
  recordedByEmployeeId?: number;
  recordedByEmployeeFullName?: string;
}

export interface HospitalizationResponse {
  id: number;
  animalId: number;
  animalName: string;
  cageId: number;
  cageName: string;

  attentionId?: number | null;

  clinicalServiceId?: number | null;
  clinicalServiceName?: string | null;

  admissionTiming: AdmissionTiming;
  cause?: HospitalizationCause | null;

  admissionDate: string;
  dischargeDate?: string;

  admissionNotes: string;

  status: HospitalizationStatus;
  evolutionNotes: EvolutionNoteResponse[];
  treatmentSchedules: TreatmentScheduleResponse[];
  vitalSigns: HospitalizationVitalSignResponse[];
  version: number;
}

export interface HospitalizationPatchResponse {
  id: number;
  version: number;
  status: HospitalizationStatus;
  updated: Record<string, unknown>;
}
