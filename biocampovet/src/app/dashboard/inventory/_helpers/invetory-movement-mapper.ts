import { ProductResponse } from "../_types/product-response";
import { InventoryMovementProductLocal } from "../(pages)/movements/types/inventory-movement-product-request";
import { InventoryMovementLocal, InventoryMovementRequest } from "../(pages)/movements/types/inventory-movement-request";
import { toLocalInventoryMovementProduct, toRequestInventoryMovementProduct } from "./inventory-movement-product-mapper";

export function toLocalInventoryMovement(
  request: InventoryMovementRequest,
  productsMap: Record<number, ProductResponse>
): InventoryMovementLocal {
  const localProducts: InventoryMovementProductLocal[] = request.products.map((prod) => {
    const product = productsMap[prod.productId];
    if (!product) throw new Error(`Producto con ID ${prod.productId} no encontrado`);
    return toLocalInventoryMovementProduct(prod, product);
  });

  return {
    ...request,
    products: localProducts,
  };
}

export function toRequestInventoryMovement(
  local: InventoryMovementLocal
): InventoryMovementRequest {
  return {
    ...local,
    products: local.products.map(toRequestInventoryMovementProduct),
  };
}