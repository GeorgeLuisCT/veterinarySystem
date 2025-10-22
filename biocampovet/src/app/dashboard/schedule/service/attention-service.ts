import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  AttentionListParams,
  AttentionResponse,
} from "../types/attention-response";
import {
  CreateAttentionFromAppointmentRequest,
  CreateAttentionRequest,
  UpdateAttentionAttendingEmployeeRequest,
  UpdateAttentionStatusRequest,
} from "../types/attention-request";

const formatDateParam = (value: string | Date): string => {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return value;
};

const buildQueryString = (params: AttentionListParams = {}): string => {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.append("page", String(params.page));
  if (params.size !== undefined) searchParams.append("size", String(params.size));
  if (params.type) searchParams.append("type", params.type);
  if (params.status) searchParams.append("status", params.status);
  if (params.branchId !== undefined) searchParams.append("branchId", String(params.branchId));
  if (params.animalId !== undefined) searchParams.append("animalId", String(params.animalId));
  if (params.emergency !== undefined) searchParams.append("emergency", String(params.emergency));
  if (params.appointmentId !== undefined) searchParams.append("appointmentId", String(params.appointmentId));
  if (params.clinicalServiceId !== undefined) {
    searchParams.append("clinicalServiceId", String(params.clinicalServiceId));
  }
  if (params.startDate) {
    searchParams.append("startDate", formatDateParam(params.startDate));
  }
  if (params.endDate) {
    searchParams.append("endDate", formatDateParam(params.endDate));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const AttentionService = {
  list: async (
    params: AttentionListParams = {}
  ): Promise<PaginatedResponse<AttentionResponse>> => {
    const response = await api.get<PaginatedResponse<AttentionResponse>>(
      `/attentions${buildQueryString(params)}`
    );
    return response.data;
  },

  getById: async (id: number): Promise<AttentionResponse> => {
    const response = await api.get<AttentionResponse>(`/attentions/${id}`);
    return response.data;
  },

  create: async (data: CreateAttentionRequest): Promise<AttentionResponse> => {
    const response = await api.post<AttentionResponse>("/attentions", data);
    return response.data;
  },

  createFromAppointment: async (
    data: CreateAttentionFromAppointmentRequest
  ): Promise<AttentionResponse> => {
    const response = await api.post<AttentionResponse>("/attentions/from-appointment", data);
    return response.data;
  },

  updateStatus: async (
    id: number,
    data: UpdateAttentionStatusRequest
  ): Promise<AttentionResponse> => {
    const response = await api.patch<AttentionResponse>(`/attentions/${id}/status`, data);
    return response.data;
  },

  updateAttendingEmployee: async (
    id: number,
    data: UpdateAttentionAttendingEmployeeRequest
  ): Promise<AttentionResponse> => {
    const response = await api.patch<AttentionResponse>(
      `/attentions/${id}/attending-employee`,
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/attentions/${id}`);
  },
};

export default AttentionService;
