import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { RoleName } from "../../../../../enums/role-name";

export type UserInfo = {
    userId: number;
    username: string;
    roles: RoleName[]; 
    selectedBranch: BranchResponse;
    employeeId: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    burden: string;
    companyId: number;
    companyName: string;
    industry: string;
    branches: BranchResponse[];
};
