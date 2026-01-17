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


export function getFieldVisitStatusStyles(status: FieldVisitStatus): { badgeClass: string; borderClass: string } {
  switch (status) {
    case FieldVisitStatus.PLANNED:
      return { badgeClass: "bg-blue-600", borderClass: "border-blue-200" };
    case FieldVisitStatus.IN_PROGRESS:
      return { badgeClass: "bg-amber-600", borderClass: "border-amber-200" };
    case FieldVisitStatus.COMPLETED:
      return { badgeClass: "bg-emerald-600", borderClass: "border-emerald-200" };
    case FieldVisitStatus.CANCELED:
      return { badgeClass: "bg-rose-600", borderClass: "border-rose-200" };
    default:
      return { badgeClass: "bg-gray-600", borderClass: "border-gray-200" };
  }
}
