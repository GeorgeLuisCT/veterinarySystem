export enum FieldTeamStatus {
  OFFLINE = "OFFLINE",
  ON_ROUTE = "ON_ROUTE",
  IN_VISIT = "IN_VISIT",
  FINISHED = "FINISHED",
}

export const FieldTeamStatusLabels: Record<FieldTeamStatus, string> = {
  [FieldTeamStatus.OFFLINE]: "Fuera de línea",
  [FieldTeamStatus.ON_ROUTE]: "En ruta",
  [FieldTeamStatus.IN_VISIT]: "En visita",
  [FieldTeamStatus.FINISHED]: "Finalizado",
};

export const FieldTeamStatusOptions = (
  Object.values(FieldTeamStatus) as FieldTeamStatus[]
).map((value) => ({
  value,
  label: FieldTeamStatusLabels[value],
}));