export enum AppointmentType {
  CLINIC = "CLINIC",
  GROOMING = "GROOMING",
  SURGERY = "SURGERY",
}

export const AppointmentTypeLabels: Record<AppointmentType, string> = {
  [AppointmentType.CLINIC]: "Consulta",
  [AppointmentType.GROOMING]: "Peluquería",
  [AppointmentType.SURGERY]: "Cirugía",
};

export const AppointmentTypeOptions = (
  Object.values(AppointmentType) as AppointmentType[]
).map((value) => ({
  value,
  label: AppointmentTypeLabels[value],
}));
