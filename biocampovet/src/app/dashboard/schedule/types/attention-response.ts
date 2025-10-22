import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { AttentionType } from "../enums/attention-type";
import { AttentionStatus } from "../enums/attention-status";
import { AnimalBasicResponse } from "../../patients/animals/types/animal-basic-response";

export interface AttentionListParams {
  page?: number;
  size?: number;
  type?: AttentionType;
  status?: AttentionStatus;
  branchId?: number;
  animalId?: number;
  emergency?: boolean;
  appointmentId?: number;
  clinicalServiceId?: number;
  startDate?: string;
  endDate?: string;
}

export interface AttentionSummaryResponse {
  id: number;
  checkInTime: string;
  status: AttentionStatus;
  type: AttentionType;
  emergency: boolean;

  animalId: number;
  animalName: string;

  branchId: number;
  branchName: string;

  attendingEmployeeId: number;
  attendingEmployeeFullName: string;

  clinicalServiceId: number | null;
  clinicalServiceName: string | null;

  appointmentId: number | null;
  surgicalOrderId: number | null;
}

export interface AttentionResponse {
  id: number;
  appointmentId: number | null;
  branch: BranchResponse;
  animalBasicResponse: AnimalBasicResponse;
  attendingEmployeeId: number | null;
  attendingEmployeeFullName: string | null;
  checkInTime: string;
  type: AttentionType;
  emergency: boolean;
  status: AttentionStatus;
  clinicalServiceId: number;
  clinicalServiceName: string;
}
