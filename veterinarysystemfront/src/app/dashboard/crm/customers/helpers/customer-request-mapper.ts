import { CustomerCreateRequest, CustomerRequest, CustomerUpdateRequest } from "../types/customer-request";

export function mapToCreateRequest(form: CustomerRequest): CustomerCreateRequest {
  return {
    ...form,
  };
}

export function mapToUpdateRequest(form: CustomerRequest, id: number): CustomerUpdateRequest {
  return {
    ...form,
    id,
  };
}
