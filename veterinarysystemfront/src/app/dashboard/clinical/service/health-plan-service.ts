import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  HealthPlanListParams,
  HealthPlanResponse,
} from "../types/health-plan-response";
import {
  CreateHealthPlanRequest,
  UpdateHealthPlanRequest,
} from "../types/health-plan-request";

export const HealthPlanService = {
  list: async ({
    page = 0,
    size = 10,
    q,
  }: HealthPlanListParams): Promise<PaginatedResponse<HealthPlanResponse>> => {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("size", String(size));
    if (q && q.trim().length > 0) {
      params.append("q", q.trim());
    }

    const response = await api.get<PaginatedResponse<HealthPlanResponse>>(
      `/health-plans?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: number): Promise<HealthPlanResponse> => {
    const response = await api.get<HealthPlanResponse>(`/health-plans/detail?id=${id}`);
    return response.data;
  },

  create: async (data: CreateHealthPlanRequest): Promise<HealthPlanResponse> => {
    const response = await api.post<HealthPlanResponse>("/health-plans", data);
    return response.data;
  },

  update: async (id: number, data: UpdateHealthPlanRequest): Promise<HealthPlanResponse> => {
    const response = await api.put<HealthPlanResponse>(`/health-plans?id=${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<HealthPlanResponse> => {
    const response = await api.delete<HealthPlanResponse>(`/health-plans?id=${id}`);
    return response.data;
  },
};

export default HealthPlanService;
