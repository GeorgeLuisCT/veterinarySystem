
import api from "@/services/api";
import { MedicalRecordSummaryResponse } from "../types/medical-record-response";

export const MedicalRecordService = {

  summaryByAnimal: async (animalId: number): Promise<MedicalRecordSummaryResponse[]> => {
    const response = await api.get<MedicalRecordSummaryResponse[]>("/history/summary", {
      params: { animalId },
    });
    return response.data;
  },
};

export default MedicalRecordService;
