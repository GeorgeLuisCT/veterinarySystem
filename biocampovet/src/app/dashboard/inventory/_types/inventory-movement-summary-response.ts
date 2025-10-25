import { InventoryMovementType } from "../_enums/inventory-movement-type";

export interface InventoryMovementSummaryResponse {
  id: number;
  type: InventoryMovementType;
  date: string;
  description?: string | null;
  sourceBranchName?: string | null;
  targetBranchName?: string | null;
  supplierName?: string | null;
  employeeName?: string | null;
}
