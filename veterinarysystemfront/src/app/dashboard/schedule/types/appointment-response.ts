import { BranchResponse } from "../../branche/types/branch-response";
import { AppointmentStatus } from "../enums/appointment-status";
import { AppointmentType } from "../enums/appointment-type";

export interface AppointmentListParams {
  type?: AppointmentType;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  assignedEmployeeId?: number;
}

export interface AppointmentSummaryResponse {
  id: number;
  type: AppointmentType;
  status: AppointmentStatus;
  startDateTime: string;
  estimatedDurationMinutes: number | null;
  branch: BranchResponse;
  animalId: number;
  animalName: string;
  assignedEmployeeId: number | null;
  assignedEmployeeFullName: string | null;
}

export interface ClinicalAppointmentDetailResponse {
  clinicalServiceId: number;
  clinicalServiceName: string;
  veterinarianId: number;
  veterinarianFullName: string;
  consultationReason: string | null;
  clinicalNotes: string | null;
}

export interface SurgicalAppointmentDetailResponse {
  orderId: number;
  finalServiceId: number;
  finalServiceName: string;
  surgeonId: number;
  surgeonFullName: string;
  anesthetistId: number | null;
  anesthetistFullName: string | null;
  operatingRoomId: number | null;
  operatingRoomName: string | null;
  prepInstructions: string | null;
}

export interface GroomingAppointmentDetailResponse {
  clinicalServiceId: number;
  clinicalServiceName: string;
  stylistId: number;
  stylistFullName: string;
  ownerSpecialNotes: string | null;
}

export interface AppointmentDetailResponse extends AppointmentSummaryResponse {
  clinicalDetail: ClinicalAppointmentDetailResponse | null;
  groomingDetail: GroomingAppointmentDetailResponse | null;
  surgicalDetail: SurgicalAppointmentDetailResponse | null;
}
