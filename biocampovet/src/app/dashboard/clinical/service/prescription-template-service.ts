import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  CreatePrescriptionTemplateRequest,
  UpdatePrescriptionTemplateRequest,
} from "../types/prescription-template-request";
import {
  PrescriptionTemplateListParams,
  PrescriptionTemplateResponse,
  PrescriptionTemplateSummaryResponse,
} from "../types/prescription-template-response";

export const PrescriptionTemplateService = {
  list: async ({
    page = 0,
    size = 10,
    q,
  }: PrescriptionTemplateListParams): Promise<PaginatedResponse<PrescriptionTemplateResponse>> => {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("size", String(size));
    if (q && q.trim().length > 0) {
      params.append("q", q.trim());
    }

    const response = await api.get<PaginatedResponse<PrescriptionTemplateResponse>>(
      `/prescription-templates?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: number): Promise<PrescriptionTemplateResponse> => {
    const response = await api.get<PrescriptionTemplateResponse>(`/prescription-templates/detail?id=${id}`);
    return response.data;
  },

  create: async (data: CreatePrescriptionTemplateRequest): Promise<PrescriptionTemplateResponse> => {
    const response = await api.post<PrescriptionTemplateResponse>("/prescription-templates", data);
    return response.data;
  },

  update: async (id: number, data: UpdatePrescriptionTemplateRequest): Promise<PrescriptionTemplateResponse> => {
    const response = await api.put<PrescriptionTemplateResponse>(`/prescription-templates?id=${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<PrescriptionTemplateSummaryResponse> => {
    const response = await api.delete<PrescriptionTemplateSummaryResponse>(`/prescription-templates?id=${id}`);
    return response.data;
  },
};

export default PrescriptionTemplateService;
