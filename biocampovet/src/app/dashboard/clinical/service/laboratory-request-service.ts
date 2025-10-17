import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import { AddResultValuesRequest, CreateLaboratoryRequest } from "./laboratory-request-request";
import { LaboratoryRequestDetailResponse, LaboratoryRequestListParams, LaboratoryRequestSummaryResponse } from "./laboratory-request-response";

export const LaboratoryRequestService = {
    list: async (params: LaboratoryRequestListParams): Promise<PaginatedResponse<LaboratoryRequestSummaryResponse>> => {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => urlParams.append(key, v));
                } else {
                    urlParams.append(key, String(value));
                }
            }
        });
        const response = await api.get<PaginatedResponse<LaboratoryRequestSummaryResponse>>(`/laboratory-requests?${urlParams.toString()}`);
        return response.data;
    },

    getDetail: async (id: number): Promise<LaboratoryRequestDetailResponse> => {
        const response = await api.get<LaboratoryRequestDetailResponse>(`/laboratory-requests/${id}`);
        return response.data;
    },

    create: async (data: CreateLaboratoryRequest): Promise<LaboratoryRequestDetailResponse> => {
        const response = await api.post<LaboratoryRequestDetailResponse>("/laboratory-requests", data);
        return response.data;
    },

    addResults: async (requestItemId: number, data: AddResultValuesRequest): Promise<LaboratoryRequestDetailResponse> => {
        const response = await api.post<LaboratoryRequestDetailResponse>(`/laboratory-requests/items/${requestItemId}/results`, data);
        return response.data;
    },
};
