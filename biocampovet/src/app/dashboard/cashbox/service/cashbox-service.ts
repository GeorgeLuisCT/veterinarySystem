import api from "@/services/api";
import { CloseCashboxRequest, OpenCashboxRequest } from "../types/cashbox-requests";
import { CashBoxResponse } from "../types/cashbox-response";
import { CashboxSummaryResponse } from "../types/cashbox-summary-response";
import { PaginatedResponse } from "@/types/paginated-response";

export const CashBoxService = {
  openCashBox: async (data: OpenCashboxRequest): Promise<number> => {
    const response = await api.post<number>("/cashboxes/open", data);
    return response.data;
  },

  closeCashBox: async (data: CloseCashboxRequest): Promise<number> => {
    const response = await api.post<number>("/cashboxes/close", data);
    return response.data;
  },

  checkOpenCashBox: async (branchId: number): Promise<boolean> => {
    const response = await api.get<boolean>("/cashboxes/open/exists", {
      params: { branchId },
    });
    return response.data;
  },

  getCashBoxById: async (id?: number): Promise<CashBoxResponse> => {
    const response = await api.get<CashBoxResponse>("/cashboxes", {
      params: { id },
    });
    return response.data;
  },

  getOpenCashBox: async (branchId: number): Promise<CashBoxResponse> => {
    const response = await api.get<CashBoxResponse>("/cashboxes/open", {
      params: { branchId },
    });
    return response.data;
  },

  getCashBoxSummaries: async (params: {
    page?: number;
    size?: number;
    branchId?: number;
    startDate: string;
    endDate: string;
  }): Promise<PaginatedResponse<CashboxSummaryResponse>> => {
    const response = await api.get<PaginatedResponse<CashboxSummaryResponse>>("/cashboxes/list", {
      params,
    });
    return response.data;
  },
};

export default CashBoxService;