import api from '@/services/api';
import { FieldRouteDayResponse } from '../types/route-response';
import { CreateRouteDayRequest } from '../types/route-request';

export const RouteService = {
  listByDate: async (date: string): Promise<FieldRouteDayResponse[]> => {
    const response = await api.get<FieldRouteDayResponse[]>('/fieldwork/route-days', { params: { date } });
    return response.data;
  },
  create: async (data: CreateRouteDayRequest): Promise<FieldRouteDayResponse> => {
    const response = await api.post<FieldRouteDayResponse>('/fieldwork/route-days', data);
    return response.data;
  },
};

export default RouteService;

