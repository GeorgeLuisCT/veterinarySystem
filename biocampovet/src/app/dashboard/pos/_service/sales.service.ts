import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  CreateSaleRequest,
  SaleListParams,
  VoidSaleRequest,
  SaleItemRequest,
  SalePaymentRequest,
  UpdateSaleRequest,
  FinalizeSaleRequest,
} from "../_types/sale-request";
import { SaleResponse, SaleSummaryResponse } from "../_types/sale-response";

const buildQueryParams = (params: Record<string, unknown>) => {
  const qp: Record<string, unknown> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qp[k] = v;
  });
  return qp;
}

const SalesService = {
  async saveSale(payload: CreateSaleRequest): Promise<SaleResponse> {
    const response = await api.post<SaleResponse>("/sales", payload);
    return response.data;
  },

  async updateSale(
    id: number,
    payload: UpdateSaleRequest
  ): Promise<SaleResponse> {
    const response = await api.put<SaleResponse>(`/sales/${id}`, payload);
    return response.data;
  },

  async getSale(id: number): Promise<SaleResponse> {
    const response = await api.get<SaleResponse>(`/sales/${id}`);
    return response.data;
  },

  async listSales(
    params: SaleListParams
  ): Promise<PaginatedResponse<SaleSummaryResponse>> {
    const {
      page = 0,
      size = 20,
      q,
      branchId,
      customerId,
      sellerId,
      status,
      documentType,
      documentNumber,
      startDate,
      endDate,
    } = params;

    const query = buildQueryParams({
      page,
      size,
      q,
      branchId,
      customerId,
      sellerId,
      status,
      documentType,
      documentNumber,
      startDate,
      endDate,
    });

    const response = await api.get<PaginatedResponse<SaleSummaryResponse>>(
      "/sales",
      {
        params: query,
      }
    );
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

  async addDetailToSale(
    saleId: number,
    payload: SaleItemRequest
  ): Promise<SaleResponse> {
    const response = await api.post<SaleResponse>(
      `/sales/${saleId}/details`,
      payload
    );
    return response.data;
  },

  async updateSaleDetail(
    saleId: number,
    detailId: number,
    payload: SaleItemRequest
  ): Promise<SaleResponse> {
    const response = await api.put<SaleResponse>(
      `/sales/${saleId}/details/${detailId}`,
      payload
    );
    return response.data;
  },

  async deleteSaleDetail(saleId: number, detailId: number): Promise<void> {
    await api.delete(`/sales/${saleId}/details/${detailId}`);
  },

  async addPaymentToSale(
    saleId: number,
    payload: SalePaymentRequest
  ): Promise<SaleResponse> {
    const response = await api.post<SaleResponse>(
      `/sales/${saleId}/payments`,
      payload
    );
    return response.data;
  },

  async updateSalePayment(
    saleId: number,
    paymentId: number,
    payload: SalePaymentRequest
  ): Promise<SaleResponse> {
    const response = await api.put<SaleResponse>(
      `/sales/${saleId}/payments/${paymentId}`,
      payload
    );
    return response.data;
  },

  async deleteSalePayment(saleId: number, paymentId: number): Promise<void> {
    await api.delete(`/sales/${saleId}/payments/${paymentId}`);
  },
  async finalizeSale(
    id: number,
    payload: FinalizeSaleRequest
  ): Promise<SaleResponse> {
    const response = await api.post<SaleResponse>(
      `/sales/${id}/finalize`,
      payload
    );
    return response.data;
  },
};

export default SalesService;