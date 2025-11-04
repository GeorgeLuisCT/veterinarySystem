export interface AnimalSummaryResponse {
    id: number;
    name: string;
    birthDate: string;
    breed?: string;
    speciesName: string;
    ownerName: string;
    isActive: boolean;
}
