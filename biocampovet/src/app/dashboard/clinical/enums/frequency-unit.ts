export enum FrequencyUnit {
  MINUTES = "MINUTES",
  HOURS = "HOURS",
}

export const FrequencyUnitLabels: Record<FrequencyUnit, string> = {
  [FrequencyUnit.MINUTES]: "Minutos",
  [FrequencyUnit.HOURS]: "Horas",
};
