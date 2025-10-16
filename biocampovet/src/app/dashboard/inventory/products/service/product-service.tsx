import api from "@/services/api";
import { ProductResponse } from "../types/product-response";
import { PaginatedResponse } from "@/types/paginated-response";
import { ProductSummaryResponse } from "../types/product-summary-response";
import { ProductCreateRequest, ProductUpdateRequest } from "../types/product-request";
import { ProductQuickSearchResponse } from "../types/product-quick-search-response";

interface ProductQueryParams {
  query?: string;
  page?: number;
  size?: number;
  active: boolean;
  branchId?: number;
}

interface ProductSearchParams {
  name: string;
  branchId?: number;
}

interface ProductIdParams {
  id: number;
  branchId?: number;
}

export const ProductService = {
  createProduct: async (
    data: ProductCreateRequest
  ): Promise<ProductSummaryResponse> => {
    const response = await api.post<ProductSummaryResponse>(
      "/products/create",
      data
    );
    return response.data;
  },

  updateProduct: async (
    data: ProductUpdateRequest
  ): Promise<ProductSummaryResponse> => {
    const response = await api.put<ProductSummaryResponse>(
      `/products/update`,
      data
    );
    return response.data;
  },

  getProduct: async (id: number): Promise<ProductResponse> => {
    const response = await api.get<ProductResponse>(
      `/products/get?id=${id}`
    );
    return response.data;
  },

  getProductsByIds: async (ids: number[]): Promise<ProductResponse[]> => {
    const response = await api.post<ProductResponse[]>(
      "/products/by-ids",
      ids
    );
    return response.data;
  },

  getProducts: async ({
    query,
    page = 0,
    size = 10,
    active,
    branchId,
  }: ProductQueryParams): Promise<PaginatedResponse<ProductSummaryResponse>> => {
    const params: ProductQueryParams = { page, size, active };
    if (query !== undefined) params.query = query;
    if (branchId !== undefined) params.branchId = branchId;

    const response = await api.get<PaginatedResponse<ProductSummaryResponse>>(
      "/products/list",
      { params }
    );
    return response.data;
  },

  searchProducts: async (
    name: string,
    branchId?: number
  ): Promise<ProductQuickSearchResponse[]> => {
    const params: ProductSearchParams = { name };
    if (branchId) params.branchId = branchId;

    const response = await api.get<ProductQuickSearchResponse[]>(
      "/products/quick-search",
      { params }
    );
    return response.data;
  },

  softDeleteProduct: async (
    id: number,
    branchId?: number
  ): Promise<{ message: string }> => {
    const params: ProductIdParams = { id };
    if (branchId !== undefined) params.branchId = branchId;

    const response = await api.delete<{ message: string }>(
      "/products/soft-delete",
      { params }
    );
    return response.data;
  },

  hardDeleteProduct: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/products/hard-delete?id=${id}`
    );
    return response.data;
  },

  restoreProduct: async (
    id: number,
    branchId?: number
  ): Promise<ProductSummaryResponse> => {
    const params: ProductIdParams = { id };
    if (branchId !== undefined) params.branchId = branchId;

    const response = await api.put<ProductSummaryResponse>(
      "/products/restore",
      null,
      { params }
    );
    return response.data;
  },
};

export default ProductService;
