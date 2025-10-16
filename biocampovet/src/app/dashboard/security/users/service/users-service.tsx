import { PaginatedResponse } from "@/types/paginated-response";
import api from "@/services/api";
import { UserSummaryResponse } from "../types/user-summary-response";

type UserQueryParams = {
    page: number;
    size: number;
    active: boolean;
    branchId?: number;
};

export const UserService = {
    getUsers: async (
        page: number = 0,
        size: number = 10,
        active: boolean,
        branchId?: number
    ): Promise<PaginatedResponse<UserSummaryResponse>> => {
        const params: UserQueryParams = { page, size, active };
        if (branchId !== undefined) params.branchId = branchId;

        const response = await api.get<PaginatedResponse<UserSummaryResponse>>(
            "/user/list",
            { params }
        );
        return response.data;
    },
};

export default UserService;
