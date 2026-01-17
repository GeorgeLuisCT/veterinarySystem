import { ProductUnitType } from '@/app/dashboard/inventory/_enums/product-unit-type';

export interface VehicleResponse {
  id: number;
  name: string;
  licensePlate?: string | null;
  assignedVetEmployeeId?: number | null;
  assignedVetName?: string | null;
  homeBranchId?: number | null;
  homeBranchName?: string | null;
  active: boolean;
}

export interface VehicleStockResponse {
  id: number;
  vehicleId: number;
  productId: number;
  productName: string;
  sku?: string | null;
  unit: ProductUnitType;
  quantity: number;
}

export interface ProductStockMovementResponse {
  id: number;
  movementType: string;
  productId: number;
  productName: string;
  unit?: ProductUnitType | null;
  quantityDelta: number;
  fromType: string;
  toType: string;
  vehicleId?: number | null;
  branchId?: number | null;
  fieldVisitId?: number | null;
  createdById?: number | null;
  createdAt: string;
  notes?: string | null;
}

export interface VehiclePingResponse {
  id: number;
  vehicleId: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  speedKmh?: number | null;
  note?: string | null;
}
