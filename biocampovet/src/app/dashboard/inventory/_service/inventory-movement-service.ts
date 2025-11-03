import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  AdjustmentCreateRequest,
  InventoryMovementListParams,
  PurchaseCreateRequest,
  TransferCreateRequest,
} from "../_types/inventory-movement-request";
import { InventoryMovementSummaryResponse } from "../_types/inventory-movement-summary-response";
import { InventoryMovementResponse } from "../_types/inventory-movement-response";
import { KardexMovementResponse } from "../_types/kardex-movement-response";

export interface KardexHistoryParams {
  page?: number;
  size?: number;
  productId: number;
  branchId: number;
  batchId?: number;
}

export const buildQueryParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params as Record<string, unknown>).flatMap(([key, value]) => {
      if (value === undefined || value === null || value === "") return [];
      if (Array.isArray(value)) {
        if (value.length === 0) return [];
        return [[key, value.join(",")]];
      }
      return [[key, value]];
    })
  ) as Partial<T>;

const toCsv = (arr?: unknown[]) => (arr && arr.length ? arr.join(",") : undefined);

export const InventoryMovementService = {
listMovements: async (
    params: InventoryMovementListParams = {}
  ): Promise<PaginatedResponse<InventoryMovementSummaryResponse>> => {
    const response = await api.get<PaginatedResponse<InventoryMovementSummaryResponse>>(
      "/inventory-movements",
      {
        params: buildQueryParams({
          ...params,
          types: toCsv(params.types),
        }),
      }
    );
    return response.data;
  },

  createPurchase: async (data: PurchaseCreateRequest): Promise<InventoryMovementResponse> => {
    const response = await api.post<InventoryMovementResponse>("/inventory-movements/purchase", data);
    return response.data;
  },

  createTransfer: async (data: TransferCreateRequest): Promise<InventoryMovementResponse> => {
    const response = await api.post<InventoryMovementResponse>("/inventory-movements/transfer", data);
    return response.data;
  },

  createAdjustment: async (data: AdjustmentCreateRequest): Promise<InventoryMovementResponse> => {
    const response = await api.post<InventoryMovementResponse>("/inventory-movements/adjustment", data);
    return response.data;
  },

  getMovement: async (id: number): Promise<InventoryMovementResponse> => {
    const response = await api.get<InventoryMovementResponse>(`/inventory-movements/${id}`);
    return response.data;
  },

  getKardexHistory: async (
    params: KardexHistoryParams
  ): Promise<PaginatedResponse<KardexMovementResponse>> => {
    const response = await api.get<PaginatedResponse<KardexMovementResponse>>(
      "/inventory-movements/kardex-history",
      { params: buildQueryParams(params) }
    );
    return response.data;
  },
};

export default InventoryMovementService;
