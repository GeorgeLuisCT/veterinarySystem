import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  CustomerCreateRequest,
  CustomerUpdateRequest,
} from "../types/customer-request";
import { CustomerSummaryResponse } from "../types/customer-summary-response";
import { CustomerResponse } from "../types/customer-response";
import { CustomerQuickSearchResponse } from "../types/customer-quick-search-response";

interface CustomerQueryParams {
  query?: string;
  page?: number;
  size?: number;
  active: boolean;
}

interface CustomerSearchParams {
  name: string;
}

export const CustomerService = {
  createCustomer: async (
    data: CustomerCreateRequest
  ): Promise<CustomerSummaryResponse> => {
    const response = await api.post<CustomerSummaryResponse>(
      "/customers/create",
      data
    );
    return response.data;
  },

  updateCustomer: async (
    data: CustomerUpdateRequest
  ): Promise<CustomerSummaryResponse> => {
    const response = await api.put<CustomerSummaryResponse>(
      "/customers/update",
      data
    );
    return response.data;
  },

  getCustomer: async (id: number): Promise<CustomerResponse> => {
    const response = await api.get<CustomerResponse>(
      `/customers/get?id=${id}`
    );
    return response.data;
  },

  getCustomers: async ({
    query,
    page = 0,
    size = 10,
    active,
  }: CustomerQueryParams): Promise<PaginatedResponse<CustomerSummaryResponse>> => {
    const params: CustomerQueryParams = { page, size, active };
    if (query !== undefined) params.query = query;

    const response = await api.get<PaginatedResponse<CustomerSummaryResponse>>(
      "/customers/list",
      { params }
    );
    return response.data;
  },

  searchCustomers: async (
    name: string
  ): Promise<CustomerQuickSearchResponse[]> => {
    const params: CustomerSearchParams = { name };
    const response = await api.get<CustomerQuickSearchResponse[]>(
      "/customers/quick-search",
      { params }
    );
    return response.data;
  },

  softDeleteCustomer: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      "/customers/soft-delete",
      { params: { id } }
    );
    return response.data;
  },

  hardDeleteCustomer: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/customers/hard-delete?id=${id}`
    );
    return response.data;
  },

  restoreCustomer: async (
    id: number
  ): Promise<CustomerSummaryResponse> => {
    const response = await api.put<CustomerSummaryResponse>(
      "/customers/restore",
      null,
      { params: { id } }
    );
    return response.data;
  },
};

export default CustomerService;
