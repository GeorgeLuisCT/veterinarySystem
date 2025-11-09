import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  AccountMovementResponse,
  TreasuryAccountResponse,
} from "../_types/treasury-account";
import { TreasuryAccountType } from "../_enums/accounts-enums";

export interface TreasuryAccountPayload {
  name: string;
  type: TreasuryAccountType;
  description?: string;
}

export interface ManualMovementPayload {
  amount: number;
  description?: string;
  income: boolean;
}

export interface MovementListParams {
  page?: number;
  size?: number;
}

const TreasuryAccountService = {
  async list(): Promise<TreasuryAccountResponse[]> {
    const response = await api.get<TreasuryAccountResponse[]>("/treasury-accounts");
    return response.data;
  },

  async create(payload: TreasuryAccountPayload): Promise<TreasuryAccountResponse> {
    const response = await api.post<TreasuryAccountResponse>("/treasury-accounts", payload);
    return response.data;
  },

  async update(id: number, payload: TreasuryAccountPayload): Promise<TreasuryAccountResponse> {
    const response = await api.put<TreasuryAccountResponse>(`/treasury-accounts/${id}`, payload);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/treasury-accounts/${id}`);
  },

  async getMovements(id: number, params: MovementListParams): Promise<PaginatedResponse<AccountMovementResponse>> {
    const response = await api.get<PaginatedResponse<AccountMovementResponse>>(`/treasury-accounts/${id}/movements`, {
      params,
    });
    return response.data;
  },

  async registerManualMovement(id: number, payload: ManualMovementPayload): Promise<AccountMovementResponse> {
    const response = await api.post<AccountMovementResponse>(`/treasury-accounts/${id}/movements`, payload);
    return response.data;
  },
};

export default TreasuryAccountService;
