import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  AnimalCreateRequest,
  AnimalUpdateRequest,
} from "../types/animal-request";
import { AnimalSummaryResponse } from "../types/animal-summary-response";
import { AnimalResponse } from "../types/animal-response";
import { AnimalQuickSearchResponse } from "../types/animal-quick-search-response";
import { ClinicalHistoryResponse } from "../types/clinical-history-response";

interface AnimalQueryParams {
  query?: string;
  page?: number;
  size?: number;
  active: boolean;
}

interface AnimalSearchParams {
  customerId: number;
  name?: string;
}

export const AnimalService = {
  createAnimal: async (
    data: AnimalCreateRequest
  ): Promise<AnimalSummaryResponse> => {
    const response = await api.post<AnimalSummaryResponse>(
      "/animals/create",
      data
    );
    return response.data;
  },

  updateAnimal: async (
    data: AnimalUpdateRequest
  ): Promise<AnimalSummaryResponse> => {
    const response = await api.put<AnimalSummaryResponse>(
      "/animals/update",
      data
    );
    return response.data;
  },

  getAnimal: async (id: number): Promise<AnimalResponse> => {
    const response = await api.get<AnimalResponse>(`/animals/get?id=${id}`);
    return response.data;
  },

  getAnimals: async ({
    query,
    page = 0,
    size = 10,
    active,
  }: AnimalQueryParams): Promise<PaginatedResponse<AnimalSummaryResponse>> => {
    const params: AnimalQueryParams = { page, size, active };
    if (query !== undefined) params.query = query;

    const response = await api.get<PaginatedResponse<AnimalSummaryResponse>>(
      "/animals/list",
      { params }
    );
    return response.data;
  },

  searchAnimals: async (
    customerId: number,
    name?: string
  ): Promise<AnimalQuickSearchResponse[]> => {
    const params: AnimalSearchParams = { customerId };
    if (name && name.trim() !== "") {
      params.name = name.trim();
    }

    const response = await api.get<AnimalQuickSearchResponse[]>(
      "/animals/quick-search",
      { params }
    );
    return response.data;
  },

  softDeleteAnimal: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      "/animals/soft-delete",
      { params: { id } }
    );
    return response.data;
  },

  hardDeleteAnimal: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/animals/hard-delete?id=${id}`
    );
    return response.data;
  },

  restoreAnimal: async (id: number): Promise<AnimalSummaryResponse> => {
    const response = await api.put<AnimalSummaryResponse>(
      "/animals/restore",
      null,
      { params: { id } }
    );
    return response.data;
  },

  getAnimalClinicalHistory: async (
    animalId: number
  ): Promise<ClinicalHistoryResponse> => {
    const response = await api.get<ClinicalHistoryResponse>(
      "/animals/clinical-history",
      { params: { animalId } }
    );
    return response.data;
  },
};

export default AnimalService;
