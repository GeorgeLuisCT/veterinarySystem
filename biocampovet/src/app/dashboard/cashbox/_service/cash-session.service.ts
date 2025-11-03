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

const CashSessionService = {
  async openSession(payload: OpenCashSessionRequest): Promise<CashSessionSummaryResponse> {
    const response = await api.post<CashSessionSummaryResponse>("/cash-sessions", payload);
    return response.data;
  },

  async getActiveSession(branchId: number, cashierId: number): Promise<CashSessionDetailResponse> {
    const response = await api.get<CashSessionDetailResponse>("/cash-sessions/active", {
      params: { branchId, cashierId },
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
    const response = await api.get<PaginatedResponse<CashSessionHistoryResponse>>("/cash-sessions/history", {
      params,
    });
    return response.data;
  },
};

export default CashSessionService;
