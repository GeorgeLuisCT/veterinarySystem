export enum AttentionType {
  CLINIC = "CLINIC",
  GROOMING = "GROOMING",
  SURGERY = "SURGERY",
}

export const AttentionTypeLabels: Record<AttentionType, string> = {
  [AttentionType.CLINIC]: "Clínica",
  [AttentionType.GROOMING]: "Peluquería",
  [AttentionType.SURGERY]: "Cirugía",
};

export const AttentionTypeOptions = (Object.values(AttentionType) as AttentionType[]).map((value) => ({
  value,
  label: AttentionTypeLabels[value],
}));

