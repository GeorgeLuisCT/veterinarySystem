import api from "@/services/api";
import { LaboratoryResponse } from "../types/laboratory-response";

const LaboratoryService = {
  listAll: async (branchId?: number): Promise<LaboratoryResponse[]> => {
    const response = await api.get<LaboratoryResponse[]>("/laboratories", {
      params: branchId ? { branchId } : undefined,
    });
    return response.data;
  },
};

export default LaboratoryService;
