import api from "@/services/api";
import {
  AccountPayableDetail,
  AccountPayablePage,
  AccountPayableStatus,
  AccountPayableSummary,
} from "../_types/account-payable";

export interface AccountPayableListParams {
  search?: string;
  status?: AccountPayableStatus;
  supplierId?: number;
  page?: number;
  size?: number;
}

export interface CreateAccountPayablePayload {
  supplierId?: number;
  description: string;
  issueDate: string;
  totalAmount: number;
}

export interface RegisterPaymentPayload {
  amount: number;
  treasuryAccountId: number;
  paymentDate?: string;
  notes?: string;
}

const AccountPayableService = {
  async list(params: AccountPayableListParams = {}): Promise<AccountPayablePage> {
    const response = await api.get<AccountPayablePage>("/accounts-payable", { params });
    return response.data;
  },

  async getDetail(id: number): Promise<AccountPayableDetail> {
    const response = await api.get<AccountPayableDetail>(`/accounts-payable/${id}`);
    return response.data;
  },

  async create(payload: CreateAccountPayablePayload): Promise<AccountPayableSummary> {
    const response = await api.post<AccountPayableSummary>("/accounts-payable", payload);
    return response.data;
  },

  async registerPayment(id: number, payload: RegisterPaymentPayload): Promise<AccountPayableDetail> {
    const response = await api.post<AccountPayableDetail>(`/accounts-payable/${id}/payments`, payload);
    return response.data;
  },
};

export default AccountPayableService;
