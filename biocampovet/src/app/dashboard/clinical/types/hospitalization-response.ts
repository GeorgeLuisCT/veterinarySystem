import { HospitalizationStatus } from "../enums/hospitalization-status";
import { AdmissionTiming } from "../enums/admission-timing";
import { HospitalizationCause } from "../enums/hospitalization-cause";

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
  version: number;
}

export interface HospitalizationPatchResponse {
  id: number;
  version: number;
  status: HospitalizationStatus;
  updated: Record<string, unknown>;
}
