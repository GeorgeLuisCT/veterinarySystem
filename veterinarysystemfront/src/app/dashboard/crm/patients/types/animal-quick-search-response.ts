import { AnimalSpecies } from "../enums/animal-species";

export interface AnimalQuickSearchResponse {
  id: number;
  name: string;
  birthDate: string;
  ownerName: string;
  species: AnimalSpecies;
  photoUrl: string | null;
  microchipNumber: string | null;
}
