import api from '@/services/api';
import { PaginatedResponse } from '@/types/paginated-response';
import { CreateGeoZoneRequest, UpdateGeoZoneRequest } from '@/app/dashboard/fieldwork/types/geo-zone-request';
import { GeoZoneListParams, GeoZoneResponse, GeoZoneSummaryResponse } from '@/app/dashboard/fieldwork/types/geo-zone-response';

export const GeoZoneService = {
  list: async (
    params: GeoZoneListParams
  ): Promise<PaginatedResponse<GeoZoneSummaryResponse>> => {
    const response = await api.get<PaginatedResponse<GeoZoneSummaryResponse>>('/geo-zones', { params });
    return response.data;
  },

  get: async (id: number): Promise<GeoZoneResponse> => {
    const response = await api.get<GeoZoneResponse>('/geo-zones/detail', {
      params: { id },
    });
    return response.data;
  },

  create: async (data: CreateGeoZoneRequest): Promise<GeoZoneResponse> => {
    const response = await api.post<GeoZoneResponse>('/geo-zones', data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateGeoZoneRequest
  ): Promise<GeoZoneResponse> => {
    const response = await api.put<GeoZoneResponse>('/geo-zones', data, {
      params: { id },
    });
    return response.data;
  },

  delete: async (id: number): Promise<GeoZoneSummaryResponse> => {
    const response = await api.delete<GeoZoneSummaryResponse>('/geo-zones', {
      params: { id },
    });
    return response.data;
  },
};

export default GeoZoneService;
