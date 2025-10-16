import { CustomerResponse } from "@/app/dashboard/customer/management/types/customer-response";
import { AnimalSpeciesResponse } from "./animal-species-response";
import { AnimalSex } from "../enums/animal-sex";

export interface AnimalResponse {
  id: number;
  name: string;
  photoUrl?: string;
  owner: CustomerResponse;
  species: AnimalSpeciesResponse;
  breed?: string;
  birthDate: string;
  sex: AnimalSex;
  microchipNumber?: string;
  allergies?: string[];
  chronicConditions?: string[];
  isActive: boolean;
}
