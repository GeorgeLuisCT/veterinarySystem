import { FieldVisitStatus } from '../enums/field-visit-status';
import { ProductUnitType } from '@/app/dashboard/inventory/products/enums/product-unit-type';
import { AdministrationRoute } from '@/app/dashboard/inventory/products/enums/administration-route';
import { ProductSummaryResponse } from '@/app/dashboard/inventory/products/types/product-summary-response';
import { AnimalSpecies } from '@/app/dashboard/patients/animals/enums/animal-species';

export interface FieldVisitCompanionResponse {
  employeeId: number;
  employeeName: string;
}

export interface FieldVisitSummaryResponse {
  id: number;
  farmId?: number | null;
  farmName?: string | null;
  zoneId?: number | null;
  zoneName?: string | null;
  scheduledDateTime: string;
  status: FieldVisitStatus;
  fieldVetId?: number | null;
  fieldVetName?: string | null;
  vehicleId?: number | null;
  vehicleName?: string | null;
  objective?: string | null;
  companions: FieldVisitCompanionResponse[];
}

export interface FieldVisitResponse extends FieldVisitSummaryResponse {
  serviceItems: FieldVisitServiceItemResponse[];
  productUsages: FieldVisitProductUsageResponse[];
  biosecurity?: FieldVisitBiosecurityResponse | null;
  attachments: FieldVisitAttachmentResponse[];
  report: FieldVisitReportResponse | null;
}

export interface FieldVisitServiceItemResponse {
  id: number;
  clinicalServiceId: number;
  clinicalServiceName: string;
  quantity: number;
  unitPrice: number;
  performedById?: number | null;
  performedByName?: string | null;
  notes?: string | null;
  animals: FieldVisitServiceAnimalResponse[];
  groups: FieldVisitServiceGroupResponse[];
  products: FieldVisitServiceProductResponse[];
}

export interface FieldVisitServiceAnimalResponse {
  id: number;
  animalId: number | null;
  animalName: string | null;
  species: AnimalSpecies | null;
  breed: string | null;
}

export interface FieldVisitServiceGroupResponse {
  id: number;
  species: AnimalSpecies | null;
  breed: string | null;
  quantity: number | null;
  description: string | null;
}

export interface FieldVisitServiceProductResponse {
  id: number;
  product: ProductSummaryResponse | null;
  dose: number | null;
  unit: ProductUnitType;
  administrationRoute: AdministrationRoute;
}

export interface FieldVisitProductUsageResponse {
  id: number;
  productId: number;
  productName: string;
  unit: ProductUnitType;
  quantityUsed: number;
  unitPrice?: number | null;
  subtotal?: number | null;
  vehicleId?: number | null;
  vehicleName?: string | null;
  notes?: string | null;
}

export interface FieldVisitAttachmentResponse {
  id: number;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
}

export interface FieldVisitBiosecurityResponse {
  vehicleAndEquipmentCleaned: boolean;
  ppeUsed: boolean;
  handHygiene: boolean;
  notes?: string | null;
}

export interface FieldVisitReportResponse {
  id: number;
  version: number;
  findings?: string | null;
  diagnoses?: string | null;
  recommendations?: string | null;
  updatedAt?: string | null;
}

export interface FieldVisitListParams {
  page?: number;
  size?: number;
  q?: string;
  status?: FieldVisitStatus;
  vetId?: number;
  farmId?: number;
  zoneId?: number;
  vehicleId?: number;
  from?: string;
  to?: string;
}
