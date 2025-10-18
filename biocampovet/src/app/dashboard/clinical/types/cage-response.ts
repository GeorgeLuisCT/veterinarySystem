import { HospitalizationStatus } from "@/app/dashboard/clinical/enums/hospitalization-status";
import { AdmissionTiming } from "../enums/admission-timing";
import { HospitalizationCause } from "../enums/hospitalization-cause";

export interface CageResponse {
  id: number;
  name: string;
  size: string;
  occupied: boolean;
  branchId: number;
  branchName: string;
  currentHospitalization?: CurrentHospitalizationBrief | null;
}

export interface CurrentHospitalizationBrief {
  id: number;
  animalId: number;
  animalName: string;
  status: HospitalizationStatus;
  admissionDate: string;
  admissionTiming: AdmissionTiming;
  cause?: HospitalizationCause | null;
  clinicalServiceId?: number | null;
  clinicalServiceName?: string | null;
  attentionId?: number | null;
}
