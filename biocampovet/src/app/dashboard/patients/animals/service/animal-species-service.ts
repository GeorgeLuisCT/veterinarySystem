import api from "@/services/api";
import { AnimalSpeciesResponse } from "../types/animal-species-response";

export const AnimalSpeciesService = {
  getAnimalSpecies: async (): Promise<AnimalSpeciesResponse[]> => {
    const response = await api.get<AnimalSpeciesResponse[]>("/animal-species");
    return response.data;
  },
};

export default AnimalSpeciesService;
