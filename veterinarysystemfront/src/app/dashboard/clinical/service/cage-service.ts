import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import { CageResponse } from "../types/cage-response";
import { CageListParams, CageRequest } from "../types/cage-request";

export const CageService = {
  list: async (params: CageListParams): Promise<PaginatedResponse<CageResponse>> => {
    const searchParams = new URLSearchParams();
    if (params.branchId) searchParams.append("branchId", String(params.branchId));
    if (params.name) searchParams.append("name", params.name);
    if (params.size) searchParams.append("size", params.size);
    if (params.isOccupied !== undefined) searchParams.append("isOccupied", String(params.isOccupied));
    if (params.page) searchParams.append("page", String(params.page));
    if (params.pageSize) searchParams.append("pageSize", String(params.pageSize));

    const response = await api.get<PaginatedResponse<CageResponse>>(`/cages?${searchParams.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<CageResponse> => {
    const response = await api.get<CageResponse>(`/cages/${id}`);
    return response.data;
  },

  create: async (data: CageRequest): Promise<CageResponse> => {
    const response = await api.post<CageResponse>("/cages", data);
    return response.data;
  },

  update: async (id: number, data: CageRequest): Promise<CageResponse> => {
    const response = await api.put<CageResponse>(`/cages/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/cages/${id}`);
  },
};

export default CageService;
