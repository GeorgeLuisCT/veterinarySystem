import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  CloseCashSessionRequest,
  OpenCashSessionRequest,
  RegisterCashMovementRequest,
  CashSessionHistoryParams,
} from "../_types/cash-session-request";
import {
  CashSessionDetailResponse,
  CashSessionHistoryResponse,
  CashSessionSummaryResponse,
} from "../_types/cash-session-response";

const buildQueryParams = (params: Record<string, unknown>) => {
  const qp: Record<string, unknown> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qp[k] = v;
  });
  return qp;
};

const CashSessionService = {
  async openSession(payload: OpenCashSessionRequest): Promise<CashSessionSummaryResponse> {
    const response = await api.post<CashSessionSummaryResponse>("/cash-sessions", payload);
    return response.data;
  },

  async getActiveSession(branchId: number): Promise<CashSessionDetailResponse> {
    const response = await api.get<CashSessionDetailResponse>("/cash-sessions/active", {
      params: { branchId },
    });
    return response.data;
  },

  async getSessionDetail(id: number): Promise<CashSessionDetailResponse> {
    const response = await api.get<CashSessionDetailResponse>(`/cash-sessions/${id}`);
    return response.data;
  },

  async registerMovement(id: number, payload: RegisterCashMovementRequest): Promise<CashSessionDetailResponse> {
    const response = await api.post<CashSessionDetailResponse>(`/cash-sessions/${id}/movements`, payload);
    return response.data;
  },

  async closeSession(id: number, payload: CloseCashSessionRequest): Promise<CashSessionSummaryResponse> {
    const response = await api.post<CashSessionSummaryResponse>(`/cash-sessions/${id}/close`, payload);
    return response.data;
  },

  async listHistory(params: CashSessionHistoryParams): Promise<PaginatedResponse<CashSessionHistoryResponse>> {
    const {
      page = 0,
      size = 20,
      branchId,
      cashierId,
      startDate,
      endDate
    } = params;

    const query = buildQueryParams({
      page,
      size,
      branchId,
      cashierId,
      startDate,
      endDate,
    });

    const response = await api.get<PaginatedResponse<CashSessionHistoryResponse>>("/cash-sessions/history", {
      params: query,
    });
    return response.data;
  },
};

export default CashSessionService;