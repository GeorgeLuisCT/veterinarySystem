import { ProductResponse } from "../../products/types/product-response";
import { InventoryMovementProductLocal, InventoryMovementProductRequest } from "../types/inventory-movement-product-request";

export function toLocalInventoryMovementProduct(
  request: InventoryMovementProductRequest,
  product: ProductResponse
): InventoryMovementProductLocal {
  return {
    ...request,
    product,
  };
}


export function toRequestInventoryMovementProduct(
  local: InventoryMovementProductLocal
): InventoryMovementProductRequest {
  const { product, ...rest } = local;
  return {
    ...rest,
    productId: product.id,
  };
}