import api from "@/services/api";
import { SaleRequest } from "../types/sale-request";
import { SaleResponse } from "../types/sale-response";
import { PaginatedResponse } from "@/types/paginated-response";
import { SaleSummaryResponse } from "../types/sale-summary-response";

export const SaleService = {
  createSale: async (data: SaleRequest): Promise<number> => {
    const response = await api.post<number>("/sales", data);
    return response.data;
  },

  getSale: async (id: number): Promise<SaleResponse> => {
    const response = await api.get<SaleResponse>("/sales", {
      params: { id },
    });
    return response.data;
  },

  getSalesSummary: async (params: {
    page?: number;
    size?: number;
    branchId?: number;
    startDate: string;
    endDate: string;
  }): Promise<PaginatedResponse<SaleSummaryResponse>> => {
    const response = await api.get<PaginatedResponse<SaleSummaryResponse>>("/sales/list", {
      params,
    });
    return response.data;
  },
};

export default SaleService;
