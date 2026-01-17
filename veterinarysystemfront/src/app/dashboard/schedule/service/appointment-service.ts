import api from "@/services/api";
import {
  AppointmentDetailResponse,
  AppointmentListParams,
  AppointmentSummaryResponse,
} from "../types/appointment-response";
import {
  AssignAppointmentEmployeeRequest,
  CreateClinicalAppointmentRequest,
  CreateGroomingAppointmentRequest,
  CreateSurgicalAppointmentRequest,
  RescheduleAppointmentRequest,
  UpdateAppointmentStatusRequest,
} from "../types/appointment-request";

const buildQueryString = (params: AppointmentListParams): string => {
  const searchParams = new URLSearchParams();

  if (params.type) searchParams.append("type", params.type);
  if (params.status) searchParams.append("status", params.status);
  if (params.startDate) searchParams.append("startDate", params.startDate);
  if (params.endDate) searchParams.append("endDate", params.endDate);
  if (params.assignedEmployeeId !== undefined) {
    searchParams.append("assignedEmployeeId", String(params.assignedEmployeeId));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const AppointmentService = {
  list: async (params: AppointmentListParams = {}): Promise<AppointmentSummaryResponse[]> => {
    const response = await api.get<AppointmentSummaryResponse[]>(`/appointments${buildQueryString(params)}`);
    return response.data;
  },

  getById: async (id: number): Promise<AppointmentDetailResponse> => {
    const response = await api.get<AppointmentDetailResponse>(`/appointments/${id}`);
    return response.data;
  },

  createClinical: async (data: CreateClinicalAppointmentRequest): Promise<AppointmentDetailResponse> => {
    const response = await api.post<AppointmentDetailResponse>("/appointments/clinical", data);
    return response.data;
  },

  createGrooming: async (data: CreateGroomingAppointmentRequest): Promise<AppointmentDetailResponse> => {
    const response = await api.post<AppointmentDetailResponse>("/appointments/grooming", data);
    return response.data;
  },

  createSurgical: async (data: CreateSurgicalAppointmentRequest): Promise<AppointmentDetailResponse> => {
    const response = await api.post<AppointmentDetailResponse>("/appointments/surgical", data);
    return response.data;
  },

  reschedule: async (id: number, data: RescheduleAppointmentRequest): Promise<AppointmentDetailResponse> => {
    const response = await api.patch<AppointmentDetailResponse>(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  updateStatus: async (id: number, data: UpdateAppointmentStatusRequest): Promise<AppointmentDetailResponse> => {
    const response = await api.patch<AppointmentDetailResponse>(`/appointments/${id}/status`, data);
    return response.data;
  },

  assignEmployee: async (id: number, data: AssignAppointmentEmployeeRequest): Promise<AppointmentDetailResponse> => {
    const response = await api.patch<AppointmentDetailResponse>(`/appointments/${id}/assign-employee`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete<void>(`/appointments/${id}`);
  },
};

export default AppointmentService;
