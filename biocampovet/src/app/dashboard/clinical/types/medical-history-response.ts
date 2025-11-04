import { AnimalSex } from "@/app/dashboard/crm/patients/enums/animal-sex";
import { AnimalSpecies } from "@/app/dashboard/crm/patients/enums/animal-species";
import { ClinicalServiceCategory } from "../enums/clinical-service-category";
import { GroomingStatus } from "../enums/grooming-status";
import { HospitalizationCause } from "../enums/hospitalization-cause";
import { HospitalizationStatus } from "../enums/hospitalization-status";
import { LabRequestStatus } from "../enums/lab-request-status";

export interface ClinicalHistoryAnimalSummaryResponse {
  animalId: number;
  animalName: string;
  species: AnimalSpecies;
  speciesLabel?: string;
  breed?: string;
  sex?: AnimalSex;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  microchip?: string;
  birthDate: string;
  age?: string;
  active: boolean;
  lastVisitDate?: string;
  lastVisitService?: string;
  lastVeterinarian?: string;
  totalConsultations: number;
  totalLabRequests: number;
  totalProcedures: number;
  lastRecordedWeightKg?: number;
}

export interface ClinicalHistoryDetailResponse {
  patient: ClinicalHistoryPatientInfo;
  lastConsultation?: ClinicalHistoryConsultation;
  consultations: ClinicalHistoryConsultation[];
  procedures: ClinicalHistoryProcedure[];
  preventiveCare: ClinicalHistoryPreventiveCare;
  labResults: ClinicalHistoryLabResult[];
  weightHistory: ClinicalHistoryWeightEntry[];
  hospitalizations: ClinicalHistoryHospitalization[];
}

export interface ClinicalHistoryPatientInfo {
  animalId: number;
  name: string;
  photoUrl?: string;
  species: AnimalSpecies;
  speciesLabel?: string;
  breed?: string;
  sex?: AnimalSex;
  sexLabel?: string;
  birthDate?: string;
  age?: string;
  microchip?: string;
  active: boolean;
  allergies?: string[];
  chronicConditions?: string[];
  owner?: ClinicalHistoryOwnerInfo;
  lastVisitDate?: string;
  lastVisitService?: string;
  lastVeterinarian?: string;
}

export interface ClinicalHistoryOwnerInfo {
  id: number;
  name: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  documentType?: string;
  documentNumber?: string;
}

export interface ClinicalHistoryConsultation {
  id: number;
  visitDate: string;
  serviceCategory?: ClinicalServiceCategory;
  clinicalServiceName?: string;
  veterinarian?: string;
  branchName?: string;
  reasonForVisit?: string;
  vitals: ClinicalHistoryVitals;
  subjective?: string;
  objective?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  medications: ClinicalHistoryMedication[];
  additionalServices: ClinicalHistoryServiceItem[];
}

export interface ClinicalHistoryVitals {
  weightKg?: number;
  temperatureCelsius?: number;
  heartRate?: number;
  respiratoryRate?: number;
}

export interface ClinicalHistoryMedication {
  id: number;
  productName?: string;
  doseAmount?: number;
  doseUnit?: string;
  route?: string;
  frequencyValue?: number;
  frequencyUnit?: string;
  administeredAt?: string;
  administeredBy?: string;
  notes?: string;
}

export interface ClinicalHistoryServiceItem {
  id: number;
  clinicalServiceName?: string;
  category?: ClinicalServiceCategory;
  quantity?: number;
  subtotal?: number;
  notes?: string;
}

export interface ClinicalHistoryProcedure {
  id: number;
  type: "SURGERY" | "HOSPITALIZATION";
  title: string;
  startedAt?: string;
  endedAt?: string;
  professionalInCharge?: string;
  notes?: string;
  status?: string;
}

export interface ClinicalHistoryPreventiveCare {
  vaccines: ClinicalHistoryPreventiveEvent[];
  deworming: ClinicalHistoryPreventiveEvent[];
  groomingSessions: ClinicalHistoryGroomingEntry[];
}

export interface ClinicalHistoryPreventiveEvent {
  serviceItemId: number;
  serviceName: string;
  category: ClinicalServiceCategory;
  performedAt?: string;
  nextDueDate?: string;
  veterinarian?: string;
  notes?: string;
}

export interface ClinicalHistoryGroomingEntry {
  id: number;
  serviceName: string;
  status: GroomingStatus;
  startedAt?: string;
  finishedAt?: string;
  assignedProfessional?: string;
  behaviorNotes?: string;
  clinicalObservations?: string;
}

export interface ClinicalHistoryLabResult {
  requestId: number;
  laboratoryName?: string;
  requestingVeterinarian?: string;
  requestedAt?: string;
  reportedAt?: string;
  status: LabRequestStatus;
  testName?: string;
  clinicalNotes?: string;
  parameters: ClinicalHistoryLabParameter[];
}

export interface ClinicalHistoryLabParameter {
  name?: string;
  value?: string;
  unit?: string;
  referenceRange?: string;
  flag?: string;
  comment?: string;
}

export interface ClinicalHistoryWeightEntry {
  recordedAt: string;
  weightKg: number;
  sourceClinicalAttentionId: number;
}

export interface ClinicalHistoryHospitalization {
  id: number;
  admissionDate: string;
  dischargeDate?: string;
  status: HospitalizationStatus;
  cause?: HospitalizationCause;
  clinicalServiceName?: string;
  attendingEmployee?: string;
  admissionNotes?: string;
  treatmentSchedules: ClinicalHistoryTreatmentSchedule[];
  evolutionNotes: ClinicalHistoryEvolutionNote[];
}

export interface ClinicalHistoryTreatmentSchedule {
  id: number;
  treatmentName: string;
  scheduledTime: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface ClinicalHistoryEvolutionNote {
  id: number;
  timestamp: string;
  author?: string;
  note: string;
}
