import { AnimalSpecies } from "../enums/animal-species";
import { AnimalSex } from "../enums/animal-sex";

export interface AnimalBasicResponse {
    animalId: number;
    animalName: string;
    animalPhotoUrl: string | null;
    animalSpecies: AnimalSpecies;
    animalBreed: string | null;
    sex: AnimalSex;
    microchipNumber: string | null;
}