export enum AnestheticPhase {
  PREMEDICATION = "PREMEDICATION",
  INDUCTION = "INDUCTION",
  MAINTENANCE = "MAINTENANCE",
}

export const AnestheticPhaseLabels: Record<AnestheticPhase, string> = {
  [AnestheticPhase.PREMEDICATION]: "Premedicación",
  [AnestheticPhase.INDUCTION]: "Inducción",
  [AnestheticPhase.MAINTENANCE]: "Mantenimiento",
};

export const AnestheticPhaseOptions = (
  Object.values(AnestheticPhase) as AnestheticPhase[]
).map((value) => ({
  value,
  label: AnestheticPhaseLabels[value],
}));
