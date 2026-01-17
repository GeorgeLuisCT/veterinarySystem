import { AnimalSpecies } from "@/app/dashboard/crm/patients/enums/animal-species";
import { ReminderStatus } from "../enums/reminder-status";
import { ReminderType } from "../enums/reminder-type";

export interface ReminderListItemResponse {
  id: number | null;
  externalId: string | null;
  automatic: boolean;
  deletable: boolean;
  reminderType: ReminderType;
  status: ReminderStatus;
  dueDate: string;
  subject: string;
  detail?: string | null;
  animalId: number;
  animalName: string;
  animalSpecies: AnimalSpecies;
  ownerId?: number | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  branchName?: string | null;
}

export interface ReminderCreateRequest {
  animalId: number;
  reminderType: ReminderType;
  dueDate: string;
}

export interface ReminderListParams {
  page?: number;
  size?: number;
  query?: string;
  types?: ReminderType[];
  statuses?: ReminderStatus[];
  dueFrom?: string;
  dueTo?: string;
  includeManual?: boolean;
  includeAutomatic?: boolean;
}
