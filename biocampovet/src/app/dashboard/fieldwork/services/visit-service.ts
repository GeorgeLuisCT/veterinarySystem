import api from '@/services/api';
import { PaginatedResponse } from '@/types/paginated-response';
import {
  FieldVisitAttachmentResponse,
  FieldVisitBiosecurityResponse,
  FieldVisitListParams,
  FieldVisitProductUsageResponse,
  FieldVisitReportResponse,
  FieldVisitResponse,
  FieldVisitServiceItemResponse,
  FieldVisitSummaryResponse,
} from '../types/visit-response';
import {
  AddAttachmentRequest,
  AddProductUsageRequest,
  AddServiceItemRequest,
  CreateVisitRequest,
  SetBiosecurityRequest,
  UpdateFieldVisitReportRequest,
  UpdateFieldVisitStatusRequest,
  UpdateVisitRequest,
} from '../types/visit-request';

export const VisitService = {
  list: async (params: FieldVisitListParams): Promise<PaginatedResponse<FieldVisitSummaryResponse>> => {
    const response = await api.get<PaginatedResponse<FieldVisitSummaryResponse>>('/fieldwork/visits', { params });
    return response.data;
  },
  get: async (id: number): Promise<FieldVisitResponse> => {
    const response = await api.get<FieldVisitResponse>('/fieldwork/visits/detail', { params: { id } });
    return response.data;
  },
  create: async (data: CreateVisitRequest): Promise<FieldVisitResponse> => {
    const response = await api.post<FieldVisitResponse>('/fieldwork/visits', data);
    return response.data;
  },
  update: async (id: number, data: UpdateVisitRequest): Promise<FieldVisitResponse> => {
    const response = await api.put<FieldVisitResponse>('/fieldwork/visits', data, { params: { id } });
    return response.data;
  },
  delete: async (id: number): Promise<FieldVisitSummaryResponse> => {
    const response = await api.delete<FieldVisitSummaryResponse>('/fieldwork/visits', { params: { id } });
    return response.data;
  },
  addServiceItem: async (visitId: number, data: AddServiceItemRequest): Promise<FieldVisitServiceItemResponse> => {
    const response = await api.post<FieldVisitServiceItemResponse>('/fieldwork/visits/service-item', data, { params: { visitId } });
    return response.data;
  },
  updateReport: async (visitId: number, data: UpdateFieldVisitReportRequest): Promise<FieldVisitReportResponse> => {
    const response = await api.patch<FieldVisitReportResponse>('/fieldwork/visits/report', data, { params: { visitId } });
    return response.data;
  },
  addProductUsage: async (visitId: number, data: AddProductUsageRequest, performedById?: number): Promise<FieldVisitProductUsageResponse> => {
    const response = await api.post<FieldVisitProductUsageResponse>('/fieldwork/visits/product-usage', data, { params: { visitId, performedById } });
    return response.data;
  },
  addAttachment: async (visitId: number, data: AddAttachmentRequest): Promise<FieldVisitAttachmentResponse> => {
    const response = await api.post<FieldVisitAttachmentResponse>('/fieldwork/visits/attachment', data, { params: { visitId } });
    return response.data;
  },
  setBiosecurity: async (visitId: number, data: SetBiosecurityRequest): Promise<FieldVisitBiosecurityResponse> => {
    const response = await api.put<FieldVisitBiosecurityResponse>('/fieldwork/visits/biosecurity', data, { params: { visitId } });
    return response.data;
  },
  updateStatus: async (visitId: number, data: UpdateFieldVisitStatusRequest): Promise<FieldVisitResponse> => {
    const response = await api.patch<FieldVisitResponse>('/fieldwork/visits/status', data, { params: { visitId } });
    return response.data;
  },
};

export default VisitService;
