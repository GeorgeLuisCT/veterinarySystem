import { InventoryMovementType } from "../_enums/inventory-movement-type";
import { SupplierSummaryResponse } from "./supplier-response";
import { InventoryMovementProductResponse } from "./inventory-movement-product-response";
import { BranchSummaryResponse } from "./branch-summary-response";

export interface InventoryEmployeeSummary {
  id: number;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}


export interface InventoryMovementResponse {
  id: number;
  type: InventoryMovementType;
  date: string;
  sourceBranch?: BranchSummaryResponse | null;
  targetBranch?: BranchSummaryResponse | null;
  supplier?: SupplierSummaryResponse | null;
  employee?: InventoryEmployeeSummary | null;
  description?: string | null;
  products: InventoryMovementProductResponse[];
}
