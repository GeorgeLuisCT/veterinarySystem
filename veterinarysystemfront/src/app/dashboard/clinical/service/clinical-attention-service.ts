import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import { ClinicalAttentionListParams, CreateClinicalAttentionRequest, UpdateClinicalAttentionRequest, AddClinicalAttentionMedicationRequest, AddClinicalAttentionServiceItemRequest, AddClinicalAttentionSurgicalOrderRequest, AddClinicalAttentionLaboratoryRequest } from "../types/clinical-attention-request";
import { ClinicalAttentionSummaryResponse, ClinicalAttentionDetailResponse, ClinicalAttentionPatchResponse, ClinicalAttentionStatusGroupResponse, ClinicalAttentionCreatedResponse } from "../types/clinical-attention-response";

export const ClinicalAttentionService = {
  list: async ({
    page = 0,
    size = 10,
    statuses,
    branchId,
    animalId,
    attentionId,
    attendingEmployeeId,
    startDate,
    endDate,
  }: ClinicalAttentionListParams): Promise<PaginatedResponse<ClinicalAttentionSummaryResponse>> => {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("size", String(size));

    if (statuses && statuses.length > 0) {
      statuses.forEach(status => params.append("statuses", status));
    }

    if (branchId !== undefined) params.append("branchId", String(branchId));
    if (animalId !== undefined) params.append("animalId", String(animalId));
    if (attentionId !== undefined) params.append("attentionId", String(attentionId));
    if (attendingEmployeeId !== undefined) params.append("attendingEmployeeId", String(attendingEmployeeId));
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get<PaginatedResponse<ClinicalAttentionSummaryResponse>>(
      `/clinical-attentions?${params.toString()}`
    );
    return response.data;
  },

  getDetail: async (id: number): Promise<ClinicalAttentionDetailResponse> => {
    const response = await api.get<ClinicalAttentionDetailResponse>(`/clinical-attentions/${id}`);
    return response.data;
  },

  create: async (data: CreateClinicalAttentionRequest): Promise<ClinicalAttentionCreatedResponse> => {
    const response = await api.post<ClinicalAttentionCreatedResponse>("/clinical-attentions", data);
    return response.data;
  },

  getOrCreateByAttentionId: async (attentionId: number): Promise<ClinicalAttentionDetailResponse> => {
    const response = await api.get<ClinicalAttentionDetailResponse>(`/clinical-attentions/by-attention/${attentionId}`);
    return response.data;
  },

  patch: async (id: number, data: UpdateClinicalAttentionRequest): Promise<ClinicalAttentionPatchResponse> => {
    const response = await api.patch<ClinicalAttentionPatchResponse>(`/clinical-attentions/${id}`, data);
    return response.data;
  },

  addMedication: async (id: number, data: AddClinicalAttentionMedicationRequest): Promise<ClinicalAttentionDetailResponse> => {
    const response = await api.post<ClinicalAttentionDetailResponse>(`/clinical-attentions/${id}/medication-administrations`, data);
    return response.data;
  },

  addServiceItem: async (id: number, data: AddClinicalAttentionServiceItemRequest): Promise<ClinicalAttentionDetailResponse> => {
    const response = await api.post<ClinicalAttentionDetailResponse>(`/clinical-attentions/${id}/service-items`, data);
    return response.data;
  },

  addSurgicalOrder: async (id: number, data: AddClinicalAttentionSurgicalOrderRequest): Promise<ClinicalAttentionDetailResponse> => {
    const response = await api.post<ClinicalAttentionDetailResponse>(`/clinical-attentions/${id}/surgical-orders`, data);
    return response.data;
  },

  addLaboratoryRequest: async (id: number, data: AddClinicalAttentionLaboratoryRequest): Promise<ClinicalAttentionDetailResponse> => {
    const response = await api.post<ClinicalAttentionDetailResponse>(`/clinical-attentions/${id}/laboratory-requests`, data);
    return response.data;
  },

  listActiveGrouped: async (attendingEmployeeId?: number): Promise<ClinicalAttentionStatusGroupResponse[]> => {
    const params: Record<string, string> = {};
    if (attendingEmployeeId !== undefined) params.attendingEmployeeId = String(attendingEmployeeId);
    const response = await api.get<ClinicalAttentionStatusGroupResponse[]>("/clinical-attentions/active/grouped", { params });
    return response.data;
  },
};

export default ClinicalAttentionService;
