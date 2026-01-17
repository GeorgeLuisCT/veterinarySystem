import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  SupplierResponse,
  SupplierSummaryResponse,
  SupplierListParams,
  SupplierQuickSearchResponse,
} from "../_types/supplier-response";
import type {
  SupplierCreateRequest,
  SupplierUpdateRequest,
} from "../_types/supplier-request";

interface SupplierSearchParams {
  query: string;
}

const buildQueryParams = (params: Record<string, unknown>) => {
  const qp: Record<string, unknown> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qp[k] = v;
  });
  return qp;
};

export const SupplierService = {
  createSupplier: async (
    data: SupplierCreateRequest
  ): Promise<SupplierSummaryResponse> => {
    const response = await api.post<SupplierSummaryResponse>("/suppliers/create", data);
    return response.data;
  },

  updateSupplier: async (
    data: SupplierUpdateRequest
  ): Promise<SupplierSummaryResponse> => {
    const response = await api.put<SupplierSummaryResponse>("/suppliers/update", data);
    return response.data;
  },

  getSupplier: async (id: number): Promise<SupplierResponse> => {
    const response = await api.get<SupplierResponse>(`/suppliers/get`, {
      params: { id },
    });
    return response.data;
  },

  getSuppliers: async (
    params: SupplierListParams
  ): Promise<PaginatedResponse<SupplierSummaryResponse>> => {
    const {
      page = 0,
      size = 10,
      q,
      active,
      supplierType,
    } = params;

    const query = buildQueryParams({
      page,
      size,
      q,
      active,
      supplierType,
    });

    const response = await api.get<PaginatedResponse<SupplierSummaryResponse>>("/suppliers", {
      params: query,
    });
    return response.data;
  },

  searchSuppliers: async (
    query: string
  ): Promise<SupplierQuickSearchResponse[]> => {
    const params: SupplierSearchParams = { query };

    const response = await api.get<SupplierQuickSearchResponse[]>("/suppliers/quick-search", {
      params,
    });
    return response.data;
  },

  softDeleteSupplier: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>("/suppliers/soft-delete", {
      params: { id },
    });
    return response.data;
  },

  hardDeleteSupplier: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/suppliers/hard-delete`, {
      params: { id },
    });
    return response.data;
  },

  restoreSupplier: async (id: number): Promise<SupplierSummaryResponse> => {
    const response = await api.put<SupplierSummaryResponse>("/suppliers/restore", null, {
      params: { id },
    });
    return response.data;
  },
};

export default SupplierService;