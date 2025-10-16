export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
  NO_SHOW = "NO_SHOW",
}

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: "Programada",
  [AppointmentStatus.CONFIRMED]: "Confirmada",
  [AppointmentStatus.CHECKED_IN]: "Registrada",
  [AppointmentStatus.IN_PROGRESS]: "En curso",
  [AppointmentStatus.COMPLETED]: "Completada",
  [AppointmentStatus.CANCELED]: "Cancelada",
  [AppointmentStatus.NO_SHOW]: "No asistió",
};

export const AppointmentStatusOptions = (
  Object.values(AppointmentStatus) as AppointmentStatus[]
).map((value) => ({
  value,
  label: AppointmentStatusLabels[value],
}));
