import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import { CreateSaleRequest, SaleListParams, VoidSaleRequest } from "../_types/sale-request";
import { SaleResponse, SaleSummaryResponse } from "../_types/sale-response";

const SalesService = {
  async saveSale(payload: CreateSaleRequest): Promise<SaleResponse> {
    const response = await api.post<SaleResponse>("/sales", payload);
    return response.data;
  },

  async getSale(id: number): Promise<SaleResponse> {
    const response = await api.get<SaleResponse>(`/sales/${id}`);
    return response.data;
  },

  async listSales(params: SaleListParams): Promise<PaginatedResponse<SaleSummaryResponse>> {
    const response = await api.get<PaginatedResponse<SaleSummaryResponse>>("/sales", {
      params,
    });
    return response.data;
  },

  async listPendingSales(branchId?: number): Promise<SaleSummaryResponse[]> {
    const response = await api.get<SaleSummaryResponse[]>("/sales/pending", {
      params: { branchId },
    });
    return response.data;
  },

  async voidSale(id: number, payload: VoidSaleRequest): Promise<SaleResponse> {
    const response = await api.post<SaleResponse>(`/sales/${id}/void`, payload);
    return response.data;
  },
};

export default SalesService;
