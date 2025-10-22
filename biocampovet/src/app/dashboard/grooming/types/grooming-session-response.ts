import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { ProductUnitType } from "@/app/dashboard/inventory/products/enums/product-unit-type";
import { GroomingStatus } from "../enums/grooming-status";
import { AnimalBasicResponse } from "../../patients/animals/types/animal-basic-response";

export interface GroomingMaterialResponse {
  id: number;
  productId: number | null;
  productName: string | null;
  unregisteredProductName: string | null;
  quantity: number;
  unitType: ProductUnitType;
  unitPrice: number | null;
  subtotal: number | null;
}

export interface GroomingSessionSummaryResponse {
  id: number;
  version: number;
  attentionId: number;
  startedAt: string | null;
  finishedAt: string | null;
  status: GroomingStatus;
  animalBasicResponse: AnimalBasicResponse;
  serviceName: string | null;
  branch: BranchResponse | null;
  assignedProfessionalId: number | null;
  assignedProfessionalFullName: string | null;
  chargedPrice: number | null;
}

export interface GroomingSessionDetailResponse {
  id: number;
  version: number;
  attentionId: number;
  status: GroomingStatus;
  startedAt: string | null;
  finishedAt: string | null;
  assignedProfessionalId: number | null;
  assignedProfessionalFullName: string | null;
  chargedPrice: number | null;
  behaviorNotes: string | null;
  clinicalObservations: string | null;
  summary: GroomingSessionSummaryResponse;
  materialsUsed: GroomingMaterialResponse[];
  photoUrls: string[];
}

export interface GroomingSessionCreatedResponse {
  groomingSessionId: number;
  attentionId: number;
  startedAt: string | null;
  finishedAt: string | null;
  assignedProfessionalId: number | null;
  status: GroomingStatus;
}

export interface GroomingSessionPatchResponse {
  id: number;
  version: number;
  status: GroomingStatus;
  updated: Record<string, unknown>;
  summary: GroomingSessionSummaryResponse;
}
