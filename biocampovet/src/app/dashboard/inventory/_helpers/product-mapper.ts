import type { ProductRequest, ProductCreateRequest, ProductUpdateRequest } from "../_types/product-request";

export function mapToCreateRequest(form: ProductRequest): ProductCreateRequest {
  return {
    ...form,
    branchIds: form.branchIds ?? [],
  };
}

export function mapToUpdateRequest(form: ProductRequest, id: number): ProductUpdateRequest {
  return {
    ...form,
    id,
  };
}
