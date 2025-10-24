import api from '@/services/api';
import { VehiclePingResponse, VehicleResponse, VehicleStockResponse, ProductStockMovementResponse } from '../types/vehicle-response';
import { VehicleQuickSearchResponse } from '../types/vehicle-quick-search-response';
import { AdjustVehicleStockRequest, CreateVehiclePingRequest, CreateVehicleRequest, UpdateVehicleRequest } from '../types/vehicle-request';
import { PaginatedResponse } from '@/types/paginated-response';

export const VehicleService = {
  list: async (): Promise<VehicleResponse[]> => {
    const response = await api.get<VehicleResponse[]>('/fieldwork/vehicles');
    return response.data;
  },
  get: async (id: number): Promise<VehicleResponse> => {
    const response = await api.get<VehicleResponse>('/fieldwork/vehicles/detail', { params: { id } });
    return response.data;
  },
  create: async (data: CreateVehicleRequest): Promise<VehicleResponse> => {
    const response = await api.post<VehicleResponse>('/fieldwork/vehicles', data);
    return response.data;
  },
  update: async (id: number, data: UpdateVehicleRequest): Promise<VehicleResponse> => {
    const response = await api.put<VehicleResponse>('/fieldwork/vehicles', data, { params: { id } });
    return response.data;
  },
  delete: async (id: number): Promise<VehicleResponse> => {
    const response = await api.delete<VehicleResponse>('/fieldwork/vehicles', { params: { id } });
    return response.data;
  },

  // Actualizado: stock paginado
  getStock: async (
    vehicleId: number,
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<VehicleStockResponse>> => {
    const response = await api.get<PaginatedResponse<VehicleStockResponse>>(
      '/fieldwork/vehicles/stock',
      { params: { vehicleId, page, size } }
    );
    return response.data;
  },

  adjustStock: async (data: AdjustVehicleStockRequest, employeeId?: number): Promise<VehicleStockResponse> => {
    const response = await api.post<VehicleStockResponse>('/fieldwork/vehicles/stock/adjust', data, { params: { employeeId } });
    return response.data;
  },
  listMovements: async (vehicleId?: number, page = 0, size = 10): Promise<PaginatedResponse<ProductStockMovementResponse>> => {
    const response = await api.get<PaginatedResponse<ProductStockMovementResponse>>('/fieldwork/vehicles/movements', { params: { vehicleId, page, size } });
    return response.data;
  },
  createPing: async (data: CreateVehiclePingRequest): Promise<VehiclePingResponse> => {
    const response = await api.post<VehiclePingResponse>('/fieldwork/vehicles/pings', data);
    return response.data;
  },
  listPings: async (vehicleId: number, from: string, to: string, page = 0, size = 10): Promise<PaginatedResponse<VehiclePingResponse>> => {
    const response = await api.get<PaginatedResponse<VehiclePingResponse>>('/fieldwork/vehicles/pings', { params: { vehicleId, from, to, page, size } });
    return response.data;
  },
  quickSearch: async (q?: string, onlyActive?: boolean): Promise<VehicleQuickSearchResponse[]> => {
    const response = await api.get<VehicleQuickSearchResponse[]>('/fieldwork/vehicles/quick-search', { params: { q, onlyActive } });
    return response.data;
  },
};

export default VehicleService;
