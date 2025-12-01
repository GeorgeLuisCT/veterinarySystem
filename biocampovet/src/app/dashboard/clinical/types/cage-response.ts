import { HospitalizationStatus } from "@/app/dashboard/clinical/enums/hospitalization-status";
import { AdmissionTiming } from "../enums/admission-timing";
import { HospitalizationCause } from "../enums/hospitalization-cause";
import { CageSize } from "../enums/cage-size";
import { AnimalBasicResponse } from "../../crm/patients/types/animal-basic-response";
import { HospitalizationVitalSignResponse, EvolutionNoteResponse } from "./hospitalization-response";

export interface CageResponse {
  id: number;
  name: string;
  size: CageSize;
  occupied: boolean;
  branchId: number;
  branchName: string;
  currentHospitalization?: CurrentHospitalizationBrief | null;
}

export interface CurrentHospitalizationBrief {
  id: number;
  animalBasicResponse: AnimalBasicResponse;
  status: HospitalizationStatus;
  admissionDate: string;
  admissionTiming: AdmissionTiming;
  cause?: HospitalizationCause | null;
  clinicalServiceId?: number | null;
  clinicalServiceName?: string | null;
  attentionId?: number | null;
  latestVitalSign?: HospitalizationVitalSignResponse | null;
  nextTreatmentSchedule?: TreatmentScheduleBriefResponse | null;
  latestEvolutionNote?: EvolutionNoteResponse | null;
}

export interface TreatmentScheduleBriefResponse {
  id: number;
  treatmentName: string;
  scheduledTime?: string;
  completed: boolean;
}
