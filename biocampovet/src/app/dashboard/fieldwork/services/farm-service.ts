import api from '@/services/api';
import { PaginatedResponse } from '@/types/paginated-response';
import { CreateFarmRequest, UpdateFarmRequest } from '@/app/dashboard/fieldwork/types/farm-request';
import { FarmListParams, FarmResponse, FarmSummaryResponse } from '@/app/dashboard/fieldwork/types/farm-response';
import { FarmQuickSearchResponse } from '@/app/dashboard/fieldwork/types/farm-quick-search-response';

export const FarmService = {
  list: async (
    params: FarmListParams
  ): Promise<PaginatedResponse<FarmSummaryResponse>> => {
    const response = await api.get<PaginatedResponse<FarmSummaryResponse>>('/farms', { params });
    return response.data;
  },

  get: async (id: number): Promise<FarmResponse> => {
    const response = await api.get<FarmResponse>('/farms/detail', {
      params: { id },
    });
    return response.data;
  },

  create: async (data: CreateFarmRequest): Promise<FarmResponse> => {
    const response = await api.post<FarmResponse>('/farms', data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateFarmRequest
  ): Promise<FarmResponse> => {
    const response = await api.put<FarmResponse>('/farms', data, {
      params: { id },
    });
    return response.data;
  },

  delete: async (id: number): Promise<FarmSummaryResponse> => {
    const response = await api.delete<FarmSummaryResponse>('/farms', {
      params: { id },
    });
    return response.data;
  },

  quickSearch: async (
    q?: string,
    zoneId?: number
  ): Promise<FarmQuickSearchResponse[]> => {
    const response = await api.get<FarmQuickSearchResponse[]>(
      '/farms/quick-search',
      { params: { q, zoneId } }
    );
    return response.data;
  },
};

export default FarmService;
