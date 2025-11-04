import { BranchResponse } from "../../branche/types/branch-response";
import { AdministrationRoute } from "../../inventory/_enums/administration-route";
import { ProductUnitType } from "../../inventory/_enums/product-unit-type";
import { ProductSummaryResponse } from "../../inventory/products/types/product-summary-response";
import { AnimalBasicResponse } from "../../crm/patients/types/animal-basic-response";
import { SurgicalOrderStatus } from "../../schedule/enums/surgical-order-status";
import { AttentionSummaryResponse } from "../../schedule/types/attention-response";
import { ClinicalAttentionStatus } from "../enums/clinical-attention-status";
import { ClinicalServiceCategory } from "../enums/clinical-service-category";
import { FrequencyUnit } from "../enums/frequency-unit";
import { LabRequestStatus } from "../enums/lab-request-status";


export interface ClinicalAttentionSummaryResponse {
  id: number;
  version: number;
  attentionId: number;
  status: ClinicalAttentionStatus;
  visitDate: string;
  animalBasicResponse: AnimalBasicResponse;
  clinicalServiceName: string;
  branch: BranchResponse;
  attendingEmployeeId: number | null;
  attendingEmployeeFullName: string | null;
}

export interface MedicationAdministrationResponse {
  id: number;
  productId: number;
  productName: string;
  administeredAt: string;
  doseAmount: number | null;
  doseUnit: ProductUnitType | null;
  route: AdministrationRoute | null;
  frequencyValue: number | null;
  frequencyUnit: FrequencyUnit | null;
  administeredByEmployeeId: number | null;
  administeredByEmployeeFullName: string | null;
  notes: string | null;
}

export interface ClinicalServiceProductResponse {
  id: number;
  product: ProductSummaryResponse;
  dose: number;
  unit: ProductUnitType;
  administrationRoute: AdministrationRoute;
}


export interface ClinicalServiceItemResponse {
  id: number;
  clinicalServiceId: number;
  clinicalServiceName: string;
  clinicalServiceCategory: ClinicalServiceCategory;
  products: ClinicalServiceProductResponse[];
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes: string | null;
}

export interface LaboratoryRequestItemResponse {
  id: number;
  testName: string;
  sampleType: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes: string | null;
}

export interface LaboratoryRequestResponse {
  id: number;
  laboratoryId: number;
  laboratoryName: string;
  requestingEmployeeId: number | null;
  requestingEmployeeFullName: string | null;
  status: LabRequestStatus;
  createdAt: string;
  clinicalNotes: string | null;
  items: LaboratoryRequestItemResponse[];
}

export interface SurgicalOrderResponse {
  id: number;
  animalId: number;
  animalName: string;
  operationRoomName: string | null;
  operationRoomId: number | null;
  recommendedServiceId: number | null;
  recommendedServiceName: string | null;
  requestedById: number;
  requestedByFullName: string;
  status: SurgicalOrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledAppointmentId: number | null;
  scheduledAppointmentStart: string | null;
}


export interface ClinicalAttentionDetailResponse {
  id: number;
  version: number;
  attentionId: number | null;
  status: ClinicalAttentionStatus;
  visitDate: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  weightKg: number | null;
  temperatureCelsius: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  summary: ClinicalAttentionSummaryResponse;
  attention: AttentionSummaryResponse;
  medicationAdministrations: MedicationAdministrationResponse[];
  serviceItems: ClinicalServiceItemResponse[];
  surgicalOrders: SurgicalOrderResponse[];
  laboratoryRequests: LaboratoryRequestResponse[];
}

export interface ClinicalAttentionPatchResponse {
  id: number;
  version: number;
  status: ClinicalAttentionStatus;
  updated: Record<string, unknown>;
  summary: ClinicalAttentionSummaryResponse;
}

export interface ClinicalAttentionStatusGroupResponse {
  status: ClinicalAttentionStatus;
  attentions: ClinicalAttentionSummaryResponse[];
}


export interface ClinicalAttentionCreatedResponse {
  animalId: number;
  attentionId: number;
  clinicalAttentionId: number;
  status: ClinicalAttentionStatus;
}
