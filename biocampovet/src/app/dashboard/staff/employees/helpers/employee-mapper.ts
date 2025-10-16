import type {
    EmployeeRequest,
    EmployeeCreateRequest,
    EmployeeUpdateRequest,
  } from "../types/employee-request";
  
  export function mapToCreateRequest(form: EmployeeRequest): EmployeeCreateRequest {
    return {
      ...form,
      branchIds: form.branchIds ?? [],
    };
  }
  
  export function mapToUpdateRequest(form: EmployeeRequest, id: number): EmployeeUpdateRequest {
    return {
      ...form,
      id,
    };
  }
  