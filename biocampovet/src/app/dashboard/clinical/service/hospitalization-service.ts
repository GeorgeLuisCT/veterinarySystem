import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  CreateHospitalizationRequest,
  UpdateHospitalizationRequest,
  AddEvolutionNoteRequest,
  UpdateTreatmentScheduleRequest,
  HospitalizationListParams,
} from "../types/hospitalization-request";
import {
  HospitalizationResponse,
  HospitalizationPatchResponse,
  HospitalizationSummaryResponse,
} from "../types/hospitalization-response";
import { CageResponse } from "../types/cage-response";

export const HospitalizationService = {
  list: async (params: HospitalizationListParams): Promise<PaginatedResponse<HospitalizationSummaryResponse>> => {
    const searchParams = new URLSearchParams();
    if (params.branchId) searchParams.append("branchId", String(params.branchId));
    if (params.animalId) searchParams.append("animalId", String(params.animalId));
    if (params.cageId) searchParams.append("cageId", String(params.cageId));
    if (params.statuses) {
      params.statuses.forEach(status => searchParams.append("statuses", status));
    }
    if (params.startDate) searchParams.append("startDate", params.startDate);
    if (params.endDate) searchParams.append("endDate", params.endDate);
    if (params.page) searchParams.append("page", String(params.page));
    if (params.pageSize) searchParams.append("pageSize", String(params.pageSize));

    const response = await api.get<PaginatedResponse<HospitalizationSummaryResponse>>(
      `/hospitalizations?${searchParams.toString()}`
    );
    return response.data;
  },

  getById: async (id: number): Promise<HospitalizationResponse> => {
    const response = await api.get<HospitalizationResponse>(`/hospitalizations/${id}`);
    return response.data;
  },

  create: async (data: CreateHospitalizationRequest): Promise<CageResponse> => {
    const response = await api.post<CageResponse>("/hospitalizations", data);
    return response.data;
  },

  patch: async (id: number, data: UpdateHospitalizationRequest): Promise<HospitalizationPatchResponse> => {
    const response = await api.patch<HospitalizationPatchResponse>(`/hospitalizations/${id}`, data);
    return response.data;
  },

  addEvolutionNote: async (id: number, data: AddEvolutionNoteRequest): Promise<HospitalizationResponse> => {
    const response = await api.post<HospitalizationResponse>(`/hospitalizations/${id}/evolution-notes`, data);
    return response.data;
  },

  updateTreatmentSchedule: async (
    hospitalizationId: number,
    scheduleId: number,
    data: UpdateTreatmentScheduleRequest
  ): Promise<HospitalizationResponse> => {
    const response = await api.patch<HospitalizationResponse>(
      `/hospitalizations/${hospitalizationId}/treatment-schedules/${scheduleId}`,
      data
    );
    return response.data;
  },

  addTreatmentSchedule: async (
    hospitalizationId: number,
    data: CreateTreatmentScheduleRequest
  ): Promise<HospitalizationResponse> => {
    const response = await api.post<HospitalizationResponse>(
      `/hospitalizations/${hospitalizationId}/treatment-schedules`,
      data
    );
    return response.data;
  },
};

export default HospitalizationService;
