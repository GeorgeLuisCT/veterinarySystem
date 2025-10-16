import { ProductUnitType } from "../../products/enums/product-unit-type";
import { ProductResponse } from "../../products/types/product-response";

export interface InventoryMovementProductResponse {
  id: number;
  product: ProductResponse;
  quantity: number;
  productUnitType: ProductUnitType;
  unitCost?: string;
  batchNumber?: string;
  expirationDate?: string;
}
