import { CustomerResponse } from "@/app/dashboard/customer/management/types/customer-response";
import { AnimalSex } from "../enums/animal-sex";
import { AnimalSpecies } from "../enums/animal-species";

export interface AnimalResponse {
  id: number;
  name: string;
  photoUrl?: string;
  owner: CustomerResponse;
  species: AnimalSpecies;
  breed?: string;
  birthDate: string;
  sex: AnimalSex;
  microchipNumber?: string;
  allergies?: string[];
  chronicConditions?: string[];
  isActive: boolean;
}
