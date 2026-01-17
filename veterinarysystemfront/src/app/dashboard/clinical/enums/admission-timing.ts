export enum AdmissionTiming {
    BEFORE_ATTENTION = "BEFORE_ATTENTION",
    DURING_ATTENTION = "DURING_ATTENTION",
    AFTER_ATTENTION = "AFTER_ATTENTION",
    NONE = "NONE",
  }
  
  export const AdmissionTimingLabels: Record<AdmissionTiming, string> = {
    [AdmissionTiming.BEFORE_ATTENTION]: "Antes de la atención",
    [AdmissionTiming.DURING_ATTENTION]: "Durante la atención",
    [AdmissionTiming.AFTER_ATTENTION]: "Después de la atención",
    [AdmissionTiming.NONE]: "Sin relación",
  };
  
  export const AdmissionTimingOptions = (
    Object.values(AdmissionTiming) as AdmissionTiming[]
  ).map((value) => ({
    value,
    label: AdmissionTimingLabels[value],
  }));
  