import type {
  SupplierRequest,
  SupplierCreateRequest,
  SupplierUpdateRequest,
} from "../_types/supplier-request";

export function mapToCreateRequest(form: SupplierRequest): SupplierCreateRequest {
  const { id, ...rest } = form;
  void id;
  return rest;
}

export function mapToUpdateRequest(form: SupplierRequest, id: number): SupplierUpdateRequest {
  return {
    ...form,
    id,
  };
}