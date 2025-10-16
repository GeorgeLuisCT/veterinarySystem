export enum AttentionStatus {
  WAITING = "WAITING",
  IN_CONSULTATION = "IN_CONSULTATION",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
}

export const AttentionStatusLabels: Record<AttentionStatus, string> = {
  [AttentionStatus.WAITING]: "En espera",
  [AttentionStatus.IN_CONSULTATION]: "En atención",
  [AttentionStatus.IN_PROGRESS]: "En progreso",
  [AttentionStatus.FINISHED]: "Finalizada",
};

export const AttentionStatusOptions = (Object.values(AttentionStatus) as AttentionStatus[]).map((value) => ({
  value,
  label: AttentionStatusLabels[value],
}));

