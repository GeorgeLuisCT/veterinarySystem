import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  GroomingSessionListParams,
  CreateGroomingSessionRequest,
  UpdateGroomingSessionRequest,
  AddGroomingMaterialRequest,
} from "../types/grooming-session-request";
import {
  GroomingSessionSummaryResponse,
  GroomingSessionDetailResponse,
  GroomingSessionCreatedResponse,
  GroomingSessionPatchResponse,
} from "../types/grooming-session-response";

const buildQueryString = (params: GroomingSessionListParams = {}): string => {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.append("page", String(params.page));
  if (params.size !== undefined) searchParams.append("size", String(params.size));
  if (params.statuses && params.statuses.length > 0) params.statuses.forEach((s) => searchParams.append("statuses", s));
  if (params.branchId !== undefined) searchParams.append("branchId", String(params.branchId));
  if (params.animalId !== undefined) searchParams.append("animalId", String(params.animalId));
  if (params.attentionId !== undefined) searchParams.append("attentionId", String(params.attentionId));
  if (params.assignedProfessionalId !== undefined) searchParams.append("assignedProfessionalId", String(params.assignedProfessionalId));
  if (params.startDate) searchParams.append("startDate", params.startDate);
  if (params.endDate) searchParams.append("endDate", params.endDate);
  const result = searchParams.toString();
  return result ? `?${result}` : "";
};

export const GroomingSessionService = {
  list: async (params: GroomingSessionListParams = {}): Promise<PaginatedResponse<GroomingSessionSummaryResponse>> => {
    const response = await api.get<PaginatedResponse<GroomingSessionSummaryResponse>>(`/grooming-sessions${buildQueryString(params)}`);
    return response.data;
  },
  getDetail: async (id: number): Promise<GroomingSessionDetailResponse> => {
    const response = await api.get<GroomingSessionDetailResponse>(`/grooming-sessions/${id}`);
    return response.data;
  },
  getOrCreateByAttention: async (attentionId: number): Promise<GroomingSessionDetailResponse> => {
    const response = await api.get<GroomingSessionDetailResponse>(`/grooming-sessions/by-attention/${attentionId}`);
    return response.data;
  },
  create: async (data: CreateGroomingSessionRequest): Promise<GroomingSessionCreatedResponse> => {
    const response = await api.post<GroomingSessionCreatedResponse>("/grooming-sessions", data);
    return response.data;
  },
  patch: async (id: number, data: UpdateGroomingSessionRequest): Promise<GroomingSessionPatchResponse> => {
    const response = await api.patch<GroomingSessionPatchResponse>(`/grooming-sessions/${id}`, data);
    return response.data;
  },
  addMaterial: async (id: number, data: AddGroomingMaterialRequest): Promise<GroomingSessionDetailResponse> => {
    const response = await api.post<GroomingSessionDetailResponse>(`/grooming-sessions/${id}/materials`, data);
    return response.data;
  },
};

export default GroomingSessionService;
