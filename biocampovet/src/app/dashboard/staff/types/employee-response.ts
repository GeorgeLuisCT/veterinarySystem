import { EmployeeBranchResponse } from "./employee-branch-response";

export interface EmployeeResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    burden: string;
    branches: EmployeeBranchResponse[];
  }
  