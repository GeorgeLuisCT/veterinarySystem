import { FaStethoscope, FaUserMd, FaBed, FaCut, FaPaw, FaPills, FaClock, FaQuestionCircle } from 'react-icons/fa';

export enum HospitalizationCause {
  CLINICAL_OBSERVATION = "CLINICAL_OBSERVATION",
  PRE_SURGERY = "PRE_SURGERY",
  POST_SURGERY = "POST_SURGERY",
  PRE_GROOMING = "PRE_GROOMING",
  POST_GROOMING = "POST_GROOMING",
  MEDICATION_MONITORING = "MEDICATION_MONITORING",
  WAITING = "WAITING",
  OTHER = "OTHER",
}

export const HospitalizationCauseLabels: Record<HospitalizationCause, string> = {
  [HospitalizationCause.CLINICAL_OBSERVATION]: "Observación clínica",
  [HospitalizationCause.PRE_SURGERY]: "Preoperatorio",
  [HospitalizationCause.POST_SURGERY]: "Postoperatorio",
  [HospitalizationCause.PRE_GROOMING]: "Preaseo",
  [HospitalizationCause.POST_GROOMING]: "Postaseo",
  [HospitalizationCause.MEDICATION_MONITORING]: "Monitoreo de medicación",
  [HospitalizationCause.WAITING]: "En espera",
  [HospitalizationCause.OTHER]: "Otro",
};

export interface CauseDetails {
  label: string;
  icon: React.ElementType;
  colorClass: string;
}

export const HospitalizationCauseDetails: Record<HospitalizationCause, CauseDetails> = {
  [HospitalizationCause.CLINICAL_OBSERVATION]: {
    label: "Observación clínica",
    icon: FaStethoscope,
    colorClass: "bg-blue-400",
  },
  [HospitalizationCause.PRE_SURGERY]: {
    label: "Preoperatorio",
    icon: FaUserMd,
    colorClass: "bg-orange-400",
  },
  [HospitalizationCause.POST_SURGERY]: {
    label: "Postoperatorio",
    icon: FaBed,
    colorClass: "bg-red-400",
  },
  [HospitalizationCause.PRE_GROOMING]: {
    label: "Preaseo",
    icon: FaCut,
    colorClass: "bg-teal-400",
  },
  [HospitalizationCause.POST_GROOMING]: {
    label: "Postaseo",
    icon: FaPaw,
    colorClass: "bg-green-400",
  },
  [HospitalizationCause.MEDICATION_MONITORING]: {
    label: "Monitoreo de medicación",
    icon: FaPills,
    colorClass: "bg-purple-400",
  },
  [HospitalizationCause.WAITING]: {
    label: "En espera",
    icon: FaClock,
    colorClass: "bg-gray-400",
  },
  [HospitalizationCause.OTHER]: {
    label: "Otro",
    icon: FaQuestionCircle,
    colorClass: "bg-black",
  },
};

export const HospitalizationCauseOptions = (
  Object.values(HospitalizationCause) as HospitalizationCause[]
).map((value) => ({
  value,
  label: HospitalizationCauseLabels[value],
}));
