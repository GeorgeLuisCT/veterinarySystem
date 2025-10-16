import type {
  SupplierRequest,
  SupplierCreateRequest,
  SupplierUpdateRequest,
} from "../types/supplier-request";

export function mapToCreateRequest(form: SupplierRequest): SupplierCreateRequest {
  return {
    ...form,
  };
}

export function mapToUpdateRequest(form: SupplierRequest, id: number): SupplierUpdateRequest {
  return {
    ...form,
    id,
  };
}
