import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  SurgicalReportListParams,
  CreateSurgicalReportRequest,
  UpdateSurgicalReportRequest,
  AddSurgicalReportAnestheticDrugRequest,
  AddSurgicalReportMaterialRequest,
  AddSurgicalReportPostOperativeIndicationRequest,
} from "../types/surgical-report-request";
import {
  SurgicalReportSummaryResponse,
  SurgicalReportDetailResponse,
  SurgicalReportCreatedResponse,
  SurgicalReportPatchResponse,
} from "../types/surgical-report-response";

const buildQueryString = (params: SurgicalReportListParams = {}): string => {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.append("page", String(params.page));
  if (params.size !== undefined) searchParams.append("size", String(params.size));
  if (params.statuses && params.statuses.length > 0) {
    params.statuses.forEach((status) => searchParams.append("statuses", status));
  }
  if (params.branchId !== undefined) searchParams.append("branchId", String(params.branchId));
  if (params.animalId !== undefined) searchParams.append("animalId", String(params.animalId));
  if (params.attentionId !== undefined) searchParams.append("attentionId", String(params.attentionId));
  if (params.surgeonId !== undefined) searchParams.append("surgeonId", String(params.surgeonId));
  if (params.operatingRoomId !== undefined) {
    searchParams.append("operatingRoomId", String(params.operatingRoomId));
  }
  if (params.startDate) searchParams.append("startDate", params.startDate);
  if (params.endDate) searchParams.append("endDate", params.endDate);

  const result = searchParams.toString();
  return result ? `?${result}` : "";
};

export const SurgicalReportService = {
  list: async (
    params: SurgicalReportListParams = {}
  ): Promise<PaginatedResponse<SurgicalReportSummaryResponse>> => {
    const response = await api.get<PaginatedResponse<SurgicalReportSummaryResponse>>(
      `/surgical-reports${buildQueryString(params)}`
    );
    return response.data;
  },

  getDetail: async (id: number): Promise<SurgicalReportDetailResponse> => {
    const response = await api.get<SurgicalReportDetailResponse>(`/surgical-reports/${id}`);
    return response.data;
  },

  getOrCreateByAttention: async (attentionId: number): Promise<SurgicalReportDetailResponse> => {
    const response = await api.get<SurgicalReportDetailResponse>(
      `/surgical-reports/by-attention/${attentionId}`
    );
    return response.data;
  },

  create: async (data: CreateSurgicalReportRequest): Promise<SurgicalReportCreatedResponse> => {
    const response = await api.post<SurgicalReportCreatedResponse>("/surgical-reports", data);
    return response.data;
  },

  patch: async (
    id: number,
    data: UpdateSurgicalReportRequest
  ): Promise<SurgicalReportPatchResponse> => {
    const response = await api.patch<SurgicalReportPatchResponse>(`/surgical-reports/${id}`, data);
    return response.data;
  },

  addAnestheticDrug: async (
    id: number,
    data: AddSurgicalReportAnestheticDrugRequest
  ): Promise<SurgicalReportDetailResponse> => {
    const response = await api.post<SurgicalReportDetailResponse>(
      `/surgical-reports/${id}/anesthetic-drugs`,
      data
    );
    return response.data;
  },

  addMaterial: async (
    id: number,
    data: AddSurgicalReportMaterialRequest
  ): Promise<SurgicalReportDetailResponse> => {
    const response = await api.post<SurgicalReportDetailResponse>(
      `/surgical-reports/${id}/materials`,
      data
    );
    return response.data;
  },

  addPostOperativeIndication: async (
    id: number,
    data: AddSurgicalReportPostOperativeIndicationRequest
  ): Promise<SurgicalReportDetailResponse> => {
    const response = await api.post<SurgicalReportDetailResponse>(
      `/surgical-reports/${id}/post-operative-indications`,
      data
    );
    return response.data;
  },
};

export default SurgicalReportService;
