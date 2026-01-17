import { FieldTaskPriority } from '../enums/field-task-priority';
import { FieldTaskStatus } from '../enums/field-task-status';
import { FieldVisitStatus } from '../enums/field-visit-status';

export interface FieldTaskSummaryResponse {
  id: number;
  title: string;
  farmId?: number | null;
  farmName?: string | null;
  zoneId?: number | null;
  zoneName?: string | null;
  priority: FieldTaskPriority;
  status: FieldTaskStatus;
  assignedToId?: number | null;
  assignedToName?: string | null;
  dueAt?: string | null;
  createdFieldVisitId?: number | null;
  createdFieldVisitStatus?: FieldVisitStatus | null;
  vehicleId?: number | null;
  vehicleName?: string | null;
}

export interface FieldTaskResponse extends FieldTaskSummaryResponse {
  description?: string | null;
}
