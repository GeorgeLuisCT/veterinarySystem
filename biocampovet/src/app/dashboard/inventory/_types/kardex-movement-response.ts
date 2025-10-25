import { KardexMovementType } from "../_enums/kardex-movement-type";

export interface KardexMovementResponse {
  id: number;
  date: string;
  type: KardexMovementType;
  quantity: string;
  resultingStock: string;
  originId: number;
  originType: string;
  productName?: string | null;
  batchNumber?: string | null;
  expirationDate?: string | null;
}
