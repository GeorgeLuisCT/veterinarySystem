import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { AttentionType } from "../enums/attention-type";
import { AttentionStatus } from "../enums/attention-status";

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
}

export interface AttentionResponse {
  id: number;
  appointmentId: number | null;
  branch: BranchResponse;
  animalId: number;
  animalName: string;
  attendingEmployeeId: number | null;
  attendingEmployeeFullName: string | null;
  checkInTime: string;
  type: AttentionType;
  emergency: boolean;
  status: AttentionStatus;
  clinicalServiceId: number;
  clinicalServiceName: string;
}
