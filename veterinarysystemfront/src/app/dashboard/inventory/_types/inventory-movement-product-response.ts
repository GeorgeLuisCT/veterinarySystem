import { ProductUnitType } from "../_enums/product-unit-type";
import { InventoryProductSummary } from "./inventory-product-summary";
import { ProductBatchSummaryResponse } from "./product-batch-response";

export interface InventoryMovementProductResponse {
  id: number;
  product: InventoryProductSummary;
  batch?: ProductBatchSummaryResponse | null;
  quantity: number;
  unitType: ProductUnitType;
  unitCost?: number | null;
}
