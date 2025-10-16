import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  SurgicalOrderListParams,
  SurgicalOrderResponse,
  SurgicalOrderSummaryResponse,
} from "../types/surgical-order-response";
import {
  CreateSurgicalOrderRequest,
  UpdateSurgicalOrderRequest,
} from "../types/surgical-order-request";

const buildQueryString = (params: SurgicalOrderListParams = {}): string => {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.append("page", String(params.page));
  if (params.size !== undefined) searchParams.append("size", String(params.size));
  if (params.status) searchParams.append("status", params.status);
  if (params.animalId !== undefined) searchParams.append("animalId", String(params.animalId));
  if (params.branchId !== undefined) searchParams.append("branchId", String(params.branchId));
  if (params.recommendedServiceId !== undefined) {
    searchParams.append("recommendedServiceId", String(params.recommendedServiceId));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const SurgicalOrderService = {
  list: async (
    params: SurgicalOrderListParams = {}
  ): Promise<PaginatedResponse<SurgicalOrderResponse>> => {
    const response = await api.get<PaginatedResponse<SurgicalOrderResponse>>(
      `/surgical-orders${buildQueryString(params)}`
    );
    return response.data;
  },

  getById: async (id: number): Promise<SurgicalOrderResponse> => {
    const response = await api.get<SurgicalOrderResponse>(`/surgical-orders/${id}`);
    return response.data;
  },

  create: async (data: CreateSurgicalOrderRequest): Promise<SurgicalOrderResponse> => {
    const response = await api.post<SurgicalOrderResponse>("/surgical-orders", data);
    return response.data;
  },

  update: async (id: number, data: UpdateSurgicalOrderRequest): Promise<SurgicalOrderResponse> => {
    const response = await api.put<SurgicalOrderResponse>(`/surgical-orders/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/surgical-orders/${id}`);
  },

  getPendingByAnimal: async (animalId: number): Promise<SurgicalOrderSummaryResponse[]> => {
    const response = await api.get<SurgicalOrderSummaryResponse[]>(
      `/surgical-orders/pending/by-animal/${animalId}`
    );
    return response.data;
  },
};

export default SurgicalOrderService;

