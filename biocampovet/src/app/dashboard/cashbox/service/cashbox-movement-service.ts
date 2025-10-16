import api from "@/services/api";
import { CashboxMovementRequest } from "../types/cashbox-movement-request";

export const CashboxMovementService = {
  registerMovement: async (data: CashboxMovementRequest): Promise<number> => {
    const response = await api.post<number>("/cashbox-movements", data);
    return response.data;
  },
};

export default CashboxMovementService;
