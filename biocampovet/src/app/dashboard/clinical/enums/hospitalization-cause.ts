export enum HospitalizationCause {
    CLINICAL_OBSERVATION = "CLINICAL_OBSERVATION",
    PRE_SURGERY = "PRE_SURGERY",
    POST_SURGERY = "POST_SURGERY",
    GROOMING_OBSERVATION = "GROOMING_OBSERVATION",
    MEDICATION_MONITORING = "MEDICATION_MONITORING",
    OTHER = "OTHER",
  }
  
  export const HospitalizationCauseLabels: Record<HospitalizationCause, string> = {
    [HospitalizationCause.CLINICAL_OBSERVATION]: "Observación clínica",
    [HospitalizationCause.PRE_SURGERY]: "Preoperatorio",
    [HospitalizationCause.POST_SURGERY]: "Postoperatorio",
    [HospitalizationCause.GROOMING_OBSERVATION]: "Observación de grooming",
    [HospitalizationCause.MEDICATION_MONITORING]: "Monitoreo de medicación",
    [HospitalizationCause.OTHER]: "Otro",
  };
  
  export const HospitalizationCauseOptions = (
    Object.values(HospitalizationCause) as HospitalizationCause[]
  ).map((value) => ({
    value,
    label: HospitalizationCauseLabels[value],
  }));
  