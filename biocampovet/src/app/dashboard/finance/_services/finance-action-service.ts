import api from "@/services/api";
import { AccountMovementResponse } from "../_types/treasury-account";
import { ExpenseRequest, TransferRequest, TransferResponse } from "../_types/finance-actions";

const FinanceActionService = {
  async registerExpense(payload: ExpenseRequest): Promise<AccountMovementResponse> {
    const response = await api.post<AccountMovementResponse>("/finance/expenses", payload);
    return response.data;
  },

  async registerTransfer(payload: TransferRequest): Promise<TransferResponse> {
    const response = await api.post<TransferResponse>("/finance/transfers", payload);
    return response.data;
  },
};

export default FinanceActionService;
