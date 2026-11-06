import type { StatusTone } from "@/components/page/status-tone";

export enum FieldVisitStatus {
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
}

export const FieldVisitStatusLabels: Record<FieldVisitStatus, string> = {
  [FieldVisitStatus.PLANNED]: "Planificada",
  [FieldVisitStatus.IN_PROGRESS]: "En progreso",
  [FieldVisitStatus.COMPLETED]: "Completada",
  [FieldVisitStatus.CANCELED]: "Cancelada",
};

export const FieldVisitStatusOptions = (
  Object.values(FieldVisitStatus) as FieldVisitStatus[]
).map((value) => ({
  value,
  label: FieldVisitStatusLabels[value],
}));


export function getFieldVisitStatusTone(status: FieldVisitStatus): StatusTone {
  switch (status) {
    case FieldVisitStatus.PLANNED:
      return "info";
    case FieldVisitStatus.IN_PROGRESS:
      return "warning";
    case FieldVisitStatus.COMPLETED:
      return "success";
    case FieldVisitStatus.CANCELED:
      return "danger";
    default:
      return "neutral";
  }
}
