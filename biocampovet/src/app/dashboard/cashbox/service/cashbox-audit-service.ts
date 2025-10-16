import api from "@/services/api";
import { CashBoxAuditRequest } from "../types/cash-box-audit-request";

export const CashBoxAuditService = {
  registerAudit: async (data: CashBoxAuditRequest): Promise<number> => {
    const response = await api.post<number>("/cashbox-audits", data);
    return response.data;
  },
};

export default CashBoxAuditService;
