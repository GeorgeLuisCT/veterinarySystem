import { SupplierQuickSearchResponse } from "@/app/dashboard/inventory/suppliers/types/supplier-quick-search-response";
import {
  SupplierCreateRequest,
  SupplierUpdateRequest,
} from "@/app/dashboard/inventory/suppliers/types/supplier-request";
import { SupplierResponse } from "@/app/dashboard/inventory/suppliers/types/supplier-response";
import { SupplierSummaryResponse } from "@/app/dashboard/inventory/suppliers/types/supplier-summary-response";
import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";

interface SupplierQueryParams {
  query?: string;
  page?: number;
  size?: number;
  active: boolean;
  supplierType?: string;
}

export const SupplierService = {
  createSupplier: async (
    data: SupplierCreateRequest
  ): Promise<SupplierSummaryResponse> => {
    const response = await api.post<SupplierSummaryResponse>(
      "/suppliers/create",
      data
    );
    return response.data;
  },

  updateSupplier: async (
    data: SupplierUpdateRequest
  ): Promise<SupplierSummaryResponse> => {
    const response = await api.put<SupplierSummaryResponse>(
      "/suppliers/update",
      data
    );
    return response.data;
  },

  getSupplier: async (id: number): Promise<SupplierResponse> => {
    const response = await api.get<SupplierResponse>(
      `/suppliers/get?id=${id}`
    );
    return response.data;
  },

  getSuppliers: async ({
    query,
    page = 0,
    size = 10,
    active,
    supplierType,
  }: SupplierQueryParams): Promise<PaginatedResponse<SupplierSummaryResponse>> => {
    const params: SupplierQueryParams = { page, size, active };
    if (query !== undefined) params.query = query;
    if (supplierType !== undefined) params.supplierType = supplierType;

    const response = await api.get<PaginatedResponse<SupplierSummaryResponse>>(
      "/suppliers/list",
      { params }
    );
    return response.data;
  },

  searchSuppliers: async (
    query: string
  ): Promise<SupplierQuickSearchResponse[]> => {
    const response = await api.get<SupplierQuickSearchResponse[]>(
      "/suppliers/quick-search",
      { params: { query } }
    );
    return response.data;
  },

  softDeleteSupplier: async (
    id: number
  ): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      "/suppliers/soft-delete",
      { params: { id } }
    );
    return response.data;
  },

  hardDeleteSupplier: async (
    id: number
  ): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/suppliers/hard-delete?id=${id}`
    );
    return response.data;
  },

  restoreSupplier: async (
    id: number
  ): Promise<SupplierSummaryResponse> => {
    const response = await api.put<SupplierSummaryResponse>(
      "/suppliers/restore",
      null,
      { params: { id } }
    );
    return response.data;
  },
};

export default SupplierService;
