export enum FieldTaskStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  CANCELED = "CANCELED",
}

export const FieldTaskStatusLabels: Record<FieldTaskStatus, string> = {
  [FieldTaskStatus.PENDING]: "Pendiente",
  [FieldTaskStatus.ASSIGNED]: "Asignada",
  [FieldTaskStatus.IN_PROGRESS]: "En progreso",
  [FieldTaskStatus.DONE]: "Completada",
  [FieldTaskStatus.CANCELED]: "Cancelada",
};

export const FieldTaskStatusOptions = (
  Object.values(FieldTaskStatus) as FieldTaskStatus[]
).map((value) => ({
  value,
  label: FieldTaskStatusLabels[value],
}));