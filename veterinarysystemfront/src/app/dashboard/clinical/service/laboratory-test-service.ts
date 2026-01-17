import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
    LaboratoryTestResponse,
    LaboratoryTestSummaryResponse,
    LaboratoryTestListParams,
    LaboratoryTestQuickSearchResponse,
} from "../types/laboratory-test-response";
import {
    CreateLaboratoryTestRequest,
    UpdateLaboratoryTestRequest
} from "../types/laboratory-test-request";

export const LaboratoryTestService = {
    list: async ({ page = 0, size = 10, q, laboratoryId }: LaboratoryTestListParams): Promise<PaginatedResponse<LaboratoryTestSummaryResponse>> => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("size", String(size));
        if (q) params.append("q", q);
        if (laboratoryId) params.append("laboratoryId", String(laboratoryId));

        const response = await api.get<PaginatedResponse<LaboratoryTestSummaryResponse>>(
            `/laboratory-tests?${params.toString()}`
        );
        return response.data;
    },

    getById: async (id: number): Promise<LaboratoryTestResponse> => {
        const response = await api.get<LaboratoryTestResponse>(`/laboratory-tests/${id}`);
        return response.data;
    },

    create: async (data: CreateLaboratoryTestRequest): Promise<LaboratoryTestResponse> => {
        const response = await api.post<LaboratoryTestResponse>("/laboratory-tests", data);
        return response.data;
    },

    update: async (id: number, data: UpdateLaboratoryTestRequest): Promise<LaboratoryTestResponse> => {
        const response = await api.put<LaboratoryTestResponse>(`/laboratory-tests/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<LaboratoryTestSummaryResponse> => {
        const response = await api.delete<LaboratoryTestSummaryResponse>(`/laboratory-tests/${id}`);
        return response.data;
    },

    setLaboratoryActivation: async (id: number, data: { laboratoryId: number; active: boolean }): Promise<LaboratoryTestSummaryResponse> => {
        const response = await api.patch<LaboratoryTestSummaryResponse>(
            `/laboratory-tests/laboratory-activation?id=${id}`,
            data
        );
        return response.data;
    },

    quickSearch: async (name: string, laboratoryId?: number): Promise<LaboratoryTestQuickSearchResponse[]> => {
        const params = new URLSearchParams();
        params.append("name", name);
        if (laboratoryId) {
            params.append("laboratoryId", String(laboratoryId));
        }
        const response = await api.get<LaboratoryTestQuickSearchResponse[]>(
            `/laboratory-tests/quick-search?${params.toString()}`
        );
        return response.data;
    },
};

export default LaboratoryTestService;
