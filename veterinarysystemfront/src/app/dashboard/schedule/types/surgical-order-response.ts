import { SurgicalOrderStatus } from "../enums/surgical-order-status";

export interface SurgicalOrderListParams {
  page?: number;
  size?: number;
  status?: SurgicalOrderStatus;
  animalId?: number;
  branchId?: number;
  recommendedServiceId?: number;
}

export interface SurgicalOrderResponse {
  id: number;
  animalId: number;
  animalName: string;
  operationRoomName: string;
  operationRoomId: number;
  recommendedServiceId: number;
  recommendedServiceName: string;
  requestedById: number;
  requestedByFullName: string;
  status: SurgicalOrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledAppointmentId: number | null;
  scheduledAppointmentStart: string | null;
}

export interface SurgicalOrderSummaryResponse {
  id: number;
  recommendedServiceId: number;
  recommendedServiceName: string;
  status: SurgicalOrderStatus;
  notes: string | null;
  createdAt: string;
}

