import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  ClinicalHistoryAnimalSummaryResponse,
  ClinicalHistoryDetailResponse,
} from "../types/medical-history-response";
import { AnimalSpecies } from "@/app/dashboard/crm/patients/enums/animal-species";

export interface ClinicalHistoryListParams {
  page?: number;
  size?: number;
  query?: string;
  species?: AnimalSpecies[];
  active?: boolean;
}

export interface ClinicalHistoryDetailParams {
  animalId: number;
  from?: string;
  to?: string;
}

export const MedicalHistoryService = {
  async listAnimals(params: ClinicalHistoryListParams): Promise<PaginatedResponse<ClinicalHistoryAnimalSummaryResponse>> {
    const urlParams = new URLSearchParams();
    const { page = 0, size = 10, query, species, active } = params;

    urlParams.append("page", String(page));
    urlParams.append("size", String(size));

    if (query) {
      urlParams.append("query", query.trim());
    }

    if (Array.isArray(species) && species.length > 0) {
      species.forEach((value) => urlParams.append("species", value));
    }

    if (active !== undefined) {
      urlParams.append("active", String(active));
    }

    const response = await api.get<PaginatedResponse<ClinicalHistoryAnimalSummaryResponse>>(
      `/history/clinical/animals?${urlParams.toString()}`,
    );
    return response.data;
  },

  async getAnimalHistory(params: ClinicalHistoryDetailParams): Promise<ClinicalHistoryDetailResponse> {
    const urlParams = new URLSearchParams();
    urlParams.append("animalId", String(params.animalId));

    if (params.from) {
      urlParams.append("from", params.from);
    }
    if (params.to) {
      urlParams.append("to", params.to);
    }

    const response = await api.get<ClinicalHistoryDetailResponse>(
      `/history/clinical/animal?${urlParams.toString()}`,
    );
    return response.data;
  },
};

export default MedicalHistoryService;
