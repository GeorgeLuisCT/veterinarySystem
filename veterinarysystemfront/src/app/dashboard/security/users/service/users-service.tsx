import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import { RoleName } from "@/enums/role-name";
import { UserSummaryResponse } from "../types/user-summary-response";
import { UserDetailResponse } from "../types/user-detail-response";

type UserQueryParams = {
  page: number;
  size: number;
  active: boolean;
  branchId?: number;
  q?: string;
};

export type CreateUserRequest = {
  username: string;
  password: string;
  roles: RoleName[];
  employeeId: number;
};

export const UserService = {
  getUsers: async (
    page: number = 0,
    size: number = 10,
    active: boolean,
    branchId?: number,
    query?: string
  ): Promise<PaginatedResponse<UserSummaryResponse>> => {
    const params: UserQueryParams = { page, size, active };
    if (branchId !== undefined) params.branchId = branchId;
    if (query) params.q = query;

    const response = await api.get<PaginatedResponse<UserSummaryResponse>>(
      "/user/list",
      { params }
    );
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<UserSummaryResponse> => {
    const response = await api.post<UserSummaryResponse>(
      "/admin/register",
      data
    );
    return response.data;
  },

  getUserDetail: async (userId: number): Promise<UserDetailResponse> => {
    const response = await api.get<UserDetailResponse>(`/user/${userId}`);
    return response.data;
  },

  updateUserStatus: async (
    userId: number,
    active: boolean
  ): Promise<UserSummaryResponse> => {
    const response = await api.patch<UserSummaryResponse>(
      `/user/${userId}/status`,
      { active }
    );
    return response.data;
  },

  deleteUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/user/${userId}`
    );
    return response.data;
  },
};

export default UserService;
