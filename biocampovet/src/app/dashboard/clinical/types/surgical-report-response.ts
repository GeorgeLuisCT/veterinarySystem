import { BranchResponse } from "../../branche/types/branch-response";
import { ProductUnitType } from "../../inventory/_enums/product-unit-type";
import { AdministrationRoute } from "../../inventory/_enums/administration-route";
import { FrequencyUnit } from "../enums/frequency-unit";
import { SurgicalReportStatus } from "../enums/surgical-report-status";
import { AnestheticPhase } from "../enums/anesthetic-phase";
import { AnimalBasicResponse } from "../../patients/animals/types/animal-basic-response";

export interface SurgicalReportSummaryResponse {
  id: number;
  version: number;
  attentionId: number;
  surgeryStartAt: string;
  surgeryEndAt: string;
  status: SurgicalReportStatus;
  animalBasicResponse: AnimalBasicResponse;
  branch: BranchResponse;
  surgeonId: number | null;
  surgeonFullName: string | null;
  clinicalServiceName: string | null;
  anesthesiologistId: number | null;
  anesthesiologistFullName: string | null;
  assistantId: number | null;
  assistantFullName: string | null;
  operatingRoomId: number | null;
  operatingRoomName: string | null;
}

export interface AnestheticDrugResponse {
  id: number;
  productId: number | null;
  productName: string | null;
  phase: AnestheticPhase;
  doseAmount: number | null;
  doseUnit: ProductUnitType | null;
  route: AdministrationRoute | null;
}

export interface SurgicalMaterialResponse {
  id: number;
  productId: number | null;
  productName: string | null;
  unregisteredProductName: string | null;
  quantity: number;
  unitType: ProductUnitType;
}

export interface PostOperativeIndicationResponse {
  id: number;
  productId: number | null;
  productName: string | null;
  nonDrugInstruction: string | null;
  doseAmount: number | null;
  doseUnit: ProductUnitType | null;
  frequencyValue: number | null;
  frequencyUnit: FrequencyUnit | null;
  route: AdministrationRoute | null;
}

export interface SurgicalReportDetailResponse {
  id: number;
  version: number;
  attentionId: number;
  surgicalOrderId: number | null;
  status: SurgicalReportStatus;
  surgeryStartAt: string;
  surgeryEndAt: string;
  surgeonId: number | null;
  surgeonFullName: string | null;
  anesthesiologistId: number | null;
  anesthesiologistFullName: string | null;
  assistantId: number | null;
  assistantFullName: string | null;
  operatingRoomId: number | null;
  operatingRoomName: string | null;
  monitoring: string | null;
  findings: string | null;
  surgicalTechniqueDescription: string | null;
  summary: SurgicalReportSummaryResponse;
  anestheticProtocol: AnestheticDrugResponse[];
  materialsUsed: SurgicalMaterialResponse[];
  postOperativeIndications: PostOperativeIndicationResponse[];
}

export interface SurgicalReportCreatedResponse {
  surgicalReportId: number;
  attentionId: number;
  surgeryStartAt: string;
  surgeryEndAt: string;
  surgeonId: number;
}

export interface SurgicalReportPatchResponse {
  id: number;
  version: number;
  status: SurgicalReportStatus;
  updated: Record<string, unknown>;
  summary: SurgicalReportSummaryResponse;
}
