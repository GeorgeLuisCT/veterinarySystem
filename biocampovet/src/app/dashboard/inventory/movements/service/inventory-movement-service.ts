import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import { InventoryMovementResponse } from "../types/inventory-movement-response";
import { InventoryMovementSummaryResponse } from "../types/inventory-movement-summary-response";
import { InventoryMovementRequest } from "../types/inventory-movement-request";
import { InventoryMovementType } from "../enums/inventory-movement-type";

export const InventoryMovementService = {
  createMovement: async (data: InventoryMovementRequest): Promise<number> => {
    const response = await api.post<number>("/inventory-movements", data);
    return response.data;
  },

  getMovement: async (id: number): Promise<InventoryMovementResponse> => {
    const response = await api.get<InventoryMovementResponse>("/inventory-movements", {
      params: { id },
    });
    return response.data;
  },

  getMovementsByTypes: async (params: {
    page?: number;
    size?: number;
    startDate?: string;
    endDate?: string;
    types: InventoryMovementType[];
  }): Promise<PaginatedResponse<InventoryMovementSummaryResponse>> => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page.toString());
    if (params.size !== undefined) queryParams.append("size", params.size.toString());
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    params.types.forEach(type => queryParams.append("types", type));

    const response = await api.get<PaginatedResponse<InventoryMovementSummaryResponse>>(
      `/inventory-movements/list-filter?${queryParams.toString()}`
    );
    return response.data;
  },
};

export default InventoryMovementService;
