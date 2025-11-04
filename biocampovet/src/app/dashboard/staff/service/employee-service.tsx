import { EmployeeQuickSearchResponse } from "@/app/dashboard/staff/types/employee-quick-search-response";
import {
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
} from "@/app/dashboard/staff/types/employee-request";
import { EmployeeResponse } from "@/app/dashboard/staff/types/employee-response";
import { EmployeeSummaryResponse } from "@/app/dashboard/staff/types/employee-summary-response";
import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";

interface EmployeeQueryParams {
  query?: string;
  page?: number;
  size?: number;
  active: boolean;
  branchId?: number;
}

interface EmployeeSearchParams {
  name: string;
  branchId?: number;
}

interface IdBranchParams {
  id: number;
  branchId?: number;
}

export const EmployeeService = {
  createEmployee: async (
    data: EmployeeCreateRequest
  ): Promise<EmployeeSummaryResponse> => {
    const response = await api.post<EmployeeSummaryResponse>(
      "/employees/create",
      data
    );
    return response.data;
  },

  updateEmployee: async (
    data: EmployeeUpdateRequest
  ): Promise<EmployeeSummaryResponse> => {
    const response = await api.put<EmployeeSummaryResponse>(
      "/employees/update",
      data
    );
    return response.data;
  },

  getEmployee: async (id: number): Promise<EmployeeResponse> => {
    const response = await api.get<EmployeeResponse>(
      `/employees/get?id=${id}`
    );
    return response.data;
  },

  getEmployees: async ({
    query,
    page = 0,
    size = 10,
    active,
    branchId,
  }: EmployeeQueryParams): Promise<
    PaginatedResponse<EmployeeSummaryResponse>
  > => {
    const params: EmployeeQueryParams = { page, size, active };
    if (query !== undefined) params.query = query;
    if (branchId !== undefined) params.branchId = branchId;

    const response = await api.get<PaginatedResponse<EmployeeSummaryResponse>>(
      "/employees",
      { params }
    );
    return response.data;
  },

  searchEmployees: async (
    name: string,
    branchId?: number
  ): Promise<EmployeeQuickSearchResponse[]> => {
    const params: EmployeeSearchParams = { name };
    if (branchId !== undefined) params.branchId = branchId;

    const response = await api.get<EmployeeQuickSearchResponse[]>(
      "/employees/quick-search",
      { params }
    );
    return response.data;
  },

  softDeleteEmployee: async (
    id: number,
    branchId?: number
  ): Promise<{ message: string }> => {
    const params: IdBranchParams = { id };
    if (branchId !== undefined) params.branchId = branchId;

    const response = await api.delete<{ message: string }>(
      "/employees/soft-delete",
      { params }
    );
    return response.data;
  },

  hardDeleteEmployee: async (
    id: number
  ): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/employees/hard-delete?id=${id}`
    );
    return response.data;
  },

  restoreEmployee: async (
    id: number,
    branchId?: number
  ): Promise<EmployeeSummaryResponse> => {
    const params: IdBranchParams = { id };
    if (branchId !== undefined) params.branchId = branchId;

    const response = await api.put<EmployeeSummaryResponse>(
      "/employees/restore",
      null,
      { params }
    );
    return response.data;
  },

  getEmployeesByRoles: async (
    roles: string[]
  ): Promise<EmployeeSummaryResponse[]> => {
    const params = new URLSearchParams();
    roles.forEach((role) => params.append("roles", role));

    const response = await api.get<EmployeeSummaryResponse[]>(
      "/employees/by-roles",
      { params }
    );
    return response.data;
  },
};

export default EmployeeService;
