import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { InventoryMovementType } from "../enums/inventory-movement-type";
import { SupplierResponse } from "../../suppliers/types/supplier-response";
import { EmployeeResponse } from "@/app/dashboard/staff/employees/types/employee-response";
import { InventoryMovementProductResponse } from "./inventory-movement-product-response";


export interface InventoryMovementResponse {
  id: number;
  type: InventoryMovementType;
  sourceBranch: BranchResponse;
  targetBranch?: BranchResponse;
  supplier?: SupplierResponse;
  employee: EmployeeResponse;
  date: string;
  description?: string;
  products: InventoryMovementProductResponse[];
}
