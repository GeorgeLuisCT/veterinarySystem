export enum FieldTaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export const FieldTaskPriorityLabels: Record<FieldTaskPriority, string> = {
  [FieldTaskPriority.LOW]: "Baja",
  [FieldTaskPriority.MEDIUM]: "Media",
  [FieldTaskPriority.HIGH]: "Alta",
  [FieldTaskPriority.URGENT]: "Urgente",
};

export const FieldTaskPriorityOptions = (
  Object.values(FieldTaskPriority) as FieldTaskPriority[]
).map((value) => ({
  value,
  label: FieldTaskPriorityLabels[value],
}));