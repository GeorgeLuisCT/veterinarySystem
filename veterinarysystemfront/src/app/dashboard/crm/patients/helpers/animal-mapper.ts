import { AnimalCreateRequest, AnimalRequest, AnimalUpdateRequest } from "../types/animal-request";

export function mapToCreateAnimalRequest(form: AnimalRequest): AnimalCreateRequest {
  return {
    ...form,
  };
}

export function mapToUpdateAnimalRequest(form: AnimalRequest, id: number): AnimalUpdateRequest {
  return {
    ...form,
    id,
  };
}
