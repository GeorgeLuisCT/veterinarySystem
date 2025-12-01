export enum FrequencyUnit {
  MINUTES = "MINUTES",
  HOURS = "HOURS",
  DAYS = "DAYS",
}

export const FrequencyUnitLabels: Record<FrequencyUnit, string> = {
  [FrequencyUnit.MINUTES]: "Minutos",
  [FrequencyUnit.HOURS]: "Horas",
  [FrequencyUnit.DAYS]: "Días",
};
