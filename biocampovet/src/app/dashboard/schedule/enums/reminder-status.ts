export enum ReminderStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  COMPLETED = "COMPLETED",
}

export const ReminderStatusLabels: Record<ReminderStatus, string> = {
  [ReminderStatus.PENDING]: "Pendiente",
  [ReminderStatus.SENT]: "Enviado",
  [ReminderStatus.COMPLETED]: "Completado",
};

export const ReminderStatusOptions = (
  Object.values(ReminderStatus) as ReminderStatus[]
).map((value) => ({
  value,
  label: ReminderStatusLabels[value],
}));
