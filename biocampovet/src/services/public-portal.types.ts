import { AnimalSex } from "@/app/dashboard/crm/patients/enums/animal-sex";
import { AnimalSpecies } from "@/app/dashboard/crm/patients/enums/animal-species";
import { AppointmentStatus } from "@/app/dashboard/schedule/enums/appointment-status";
import { AppointmentType } from "@/app/dashboard/schedule/enums/appointment-type";

export interface PublicAnimalSummary {
  id: number;
  name: string;
  photoUrl?: string | null;
  species: AnimalSpecies;
  speciesLabel?: string | null;
  breed?: string | null;
  sex?: AnimalSex | null;
}

export interface PublicAppointmentRequestPayload {
  documentTypeId: number;
  documentNumber: string;
  animalId: number;
  branchId: number;
  type: AppointmentType;
  preferredDateTime: string;
  estimatedDurationMinutes?: number | null;
  requesterName: string;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  notes?: string | null;
}

export interface PublicAppointmentResponse {
  appointmentId: number;
  status: AppointmentStatus;
  type: AppointmentType;
  requestedStart: string;
  branchName: string;
  animalName: string;
}
