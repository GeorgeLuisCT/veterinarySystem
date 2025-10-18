export interface AnimalQuickSearchResponse {
  id: number;
  name: string;
  birthDate: string;
  ownerName: string;
  speciesName: string;
  photoUrl: string | null;
  microchipNumber: string | null;
}
