export interface InventoryMovementSummaryResponse {
  id: number;
  type: string;
  sourceBranch: string;
  targetBranch: string;
  supplierName: string;
  date: string;
  productCount: number;
  totalCost: string;
}
