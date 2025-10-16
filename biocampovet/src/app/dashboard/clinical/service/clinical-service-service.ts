import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  ClinicalServiceResponse,
  ClinicalServiceSummaryResponse,
  ClinicalServiceListParams,
  ClinicalServiceQuickSearchResponse,
} from "../types/clinical-service-response";
import { 
  CreateClinicalServiceRequest, 
  UpdateClinicalServiceRequest
} from "../types/clinical-service-request";
import { BranchActivationInput } from "../../branche/types/branch-activation-input";

export const ClinicalServiceService = {
  list: async ({
    page = 0,
    size = 10,
    q,
    category,
  }: ClinicalServiceListParams): Promise<PaginatedResponse<ClinicalServiceSummaryResponse>> => {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("size", String(size));
    if (q) params.append("q", q);
    if (category) params.append("category", category);

    const response = await api.get<PaginatedResponse<ClinicalServiceSummaryResponse>>(
      `/clinical-services?${params.toString()}` 
    );
    return response.data;
  },

  getById: async (id: number): Promise<ClinicalServiceResponse> => {
    const response = await api.get<ClinicalServiceResponse>(`/clinical-services/detail?id=${id}`);
    return response.data;
  },

  create: async (data: CreateClinicalServiceRequest): Promise<ClinicalServiceResponse> => {
    const response = await api.post<ClinicalServiceResponse>("/clinical-services", data);
    return response.data;
  },

  update: async (id: number, data: UpdateClinicalServiceRequest): Promise<ClinicalServiceResponse> => {
    const response = await api.put<ClinicalServiceResponse>(`/clinical-services?id=${id}`, data);
    return response.data;
  },

  setBranchActivation: async (id: number, data: BranchActivationInput): Promise<ClinicalServiceSummaryResponse> => {
    const response = await api.patch<ClinicalServiceSummaryResponse>(`/clinical-services/branch-activation?id=${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ClinicalServiceSummaryResponse> => {
    const response = await api.delete<ClinicalServiceSummaryResponse>(`/clinical-services?id=${id}`);
    return response.data;
  },

  quickSearch: async (name: string, branchId?: number): Promise<ClinicalServiceQuickSearchResponse[]> => {
    const params: Record<string, string> = { name };
    if (branchId !== undefined) {
      params.branchId = String(branchId);
    }

    const response = await api.get<ClinicalServiceQuickSearchResponse[]>(
      "/clinical-services/quick-search",
      { params }
    );
    return response.data;
  },
};

export default ClinicalServiceService;
