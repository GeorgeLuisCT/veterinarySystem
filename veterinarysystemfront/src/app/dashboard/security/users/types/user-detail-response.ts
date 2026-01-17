import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { RoleName } from "@/enums/role-name";

export interface UserDetailResponse {
  userId: number;
  username: string;
  active: boolean;
  roles: RoleName[];
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  burden: string;
  branches: BranchResponse[];
}
