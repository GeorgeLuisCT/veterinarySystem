import api from "@/services/api";
import { BranchResponse } from "../types/branch-response";

export const BranchService = {
  getBranches: async (query?: string): Promise<BranchResponse[]> => {
    const params: Record<string, string> = {};

    if (query?.trim()) {
      params["search"] = query.trim();
    }

    const response = await api.get<BranchResponse[]>("/branches", {
      params,
    });

    return response.data;
  },

  getBranchesByLoggedEmployee: async (): Promise<BranchResponse[]> => {
    const response = await api.get<BranchResponse[]>("/branches/by-employee");
    return response.data;
  },

};
