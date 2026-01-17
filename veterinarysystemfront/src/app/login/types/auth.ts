import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";

export type LoginResponse = {
  token?: string;
  branches?: BranchResponse[];
};
