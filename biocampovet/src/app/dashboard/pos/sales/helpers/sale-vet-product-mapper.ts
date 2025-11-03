import { AnimalQuickSearchResponse } from "@/app/dashboard/patients/animals/types/animal-quick-search-response";
import { SaleProductLocal, SaleProductRequest } from "../types/sale-product-request";
import { generateUID } from "@/utils/uid-generator";
import { ProductResponse } from "../../../inventory/_types/product-response";

/**
 * Transforma un SaleProductRequest en SaleProductLocal agregando el producto y el animal como objetos completos
 */
export function toLocalSaleProduct(
  base: SaleProductRequest,
  product: ProductResponse,
  animals: AnimalQuickSearchResponse[],
  uid?: string
): SaleProductLocal {
  const animal = base.animalId ? animals.find(a => a.id === base.animalId) : undefined;

  return {
    ...base,
    product,
    animal,
    uid: uid ?? generateUID(),
  };
}

/**
 * Transforma un SaleProductLocal en SaleProductRequest para enviarlo al backend
 */
export function toRequestSaleProduct(local: SaleProductLocal): SaleProductRequest {
  const {
    product,
    animal,
    ...rest
  } = local;

  return {
    ...rest,
    productId: product.id,
    ...(animal ? { animalId: animal.id } : {}),
  };
}
