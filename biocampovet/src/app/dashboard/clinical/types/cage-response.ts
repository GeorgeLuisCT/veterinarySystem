import { HospitalizationStatus } from "@/app/dashboard/clinical/enums/hospitalization-status";
import { AdmissionTiming } from "../enums/admission-timing";
import { HospitalizationCause } from "../enums/hospitalization-cause";
import { CageSize } from "../enums/cage-size";
import { AnimalSpecies } from "../../patients/animals/enums/animal-species";
import { AnimalSex } from "../../patients/animals/enums/animal-sex";

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
  animalId: number;
  animalName: string;
  animalPhotoUrl: string | null;
  animalSpecies: AnimalSpecies;
  animalBreed: string | null;
  sex: AnimalSex;
  microchipNumber: string | null;
  status: HospitalizationStatus;
  admissionDate: string;
  admissionTiming: AdmissionTiming;
  cause?: HospitalizationCause | null;
  clinicalServiceId?: number | null;
  clinicalServiceName?: string | null;
  attentionId?: number | null;
}
