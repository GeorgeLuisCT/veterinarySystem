namespace VetSaas.Modules.Clinic.Domain;

/// <summary>Unidades de tiempo para recordatorios y duraciones.</summary>
public enum TimeUnit { DAYS, WEEKS, MONTHS }

public enum AdmissionTiming { BEFORE_ATTENTION, DURING_ATTENTION, AFTER_ATTENTION, NONE }
public enum AnestheticPhase { PREMEDICATION, INDUCTION, MAINTENANCE }
public enum AppointmentStatus { REQUESTED, SCHEDULED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELED, NO_SHOW }
public enum AppointmentType { CLINIC, GROOMING, SURGERY }
public enum AttentionsStatus { WAITING, IN_CONSULTATION, IN_PROGRESS, FINISHED }
public enum AttentionType { CLINIC, GROOMING, SURGERY }
public enum CageSize { SMALL, MEDIUM, LARGE }
public enum ClinicalAttentionStatus { OPEN, IN_PROGRESS, WAITING_LAB, READY_TO_BILL, CLOSED, CANCELED }
public enum ClinicalServiceCategory { CONSULTATION, VACCINATION, DEWORMING, SURGERY, LABORATORY, GROOMING, OTHER }
public enum FrequencyUnit { MINUTES, HOURS, DAYS }
public enum GroomingStatus { WAITING, DRAFT, BATHING, DRYING, FINISHING, READY_FOR_PICKUP }

public enum HospitalizationCause
{
    CLINICAL_OBSERVATION, PRE_SURGERY, POST_SURGERY, PRE_GROOMING, POST_GROOMING, MEDICATION_MONITORING, WAITING, OTHER
}

public enum HospitalizationStatus { ADMITTED, IN_TREATMENT, STABLE, OBSERVATION, CRITICAL, DISCHARGED, CANCELLED }
public enum LabRequestItemStatus { REQUESTED, IN_PROCESS, REPORTED, VERIFIED, WITH_RESULTS, CANCELED }
public enum LabRequestStatus { REQUESTED, IN_PROGRESS, COMPLETED, CANCELED }

public enum LabUnit
{
    NONE, PERCENT, G_PER_DL, MG_PER_DL, UG_PER_DL, NG_PER_ML, MMOL_PER_L, MOL_PER_L, U_PER_L, IU_PER_L, K_U_PER_L,
    X10_3_PER_UL, X10_6_PER_UL, CELLS_PER_UL, PLATELETS_PER_UL, FL, PG, G_PER_L, MG_PER_L, UMOL_PER_L, MS, SEC, MIN
}

public enum LabValueType { NUMERIC, TEXT, BOOLEAN, SELECT }

public enum MedicalRecordCategory
{
    CONSULTATION, SURGERY, GROOMING, VACCINATION, LAB, NOTE, MED_ADMIN, WEIGHT, ATTACHMENT, STATUS_CHANGE
}

public enum RecordVisibility { INTERNAL, OWNER, PRIVATE }
public enum ReminderStatus { PENDING, SENT, COMPLETED }

public enum ReminderType
{
    VACCINATION, DEWORMING, CHECKUP, LAB_TEST, SURGERY_FOLLOWUP, MEDICATION_REFILL, GROOMING, DENTAL_CARE, OTHER
}

public enum SurgicalOrderStatus { PENDING, SCHEDULED, COMPLETED, CANCELED }
public enum SurgicalReportStatus { DRAFT, IN_PROGRESS, READY_TO_BILL, COMPLETED, CANCELLED }

public static class ClinicEnumLabels
{
    public static string Label(this ClinicalAttentionStatus status) => status switch
    {
        ClinicalAttentionStatus.OPEN => "Abierta",
        ClinicalAttentionStatus.IN_PROGRESS => "En progreso",
        ClinicalAttentionStatus.WAITING_LAB => "Esperando a laboratorio",
        ClinicalAttentionStatus.READY_TO_BILL => "Listo para facturar",
        ClinicalAttentionStatus.CLOSED => "Cerrada",
        _ => "Cancelada",
    };

    public static string Symbol(this LabUnit unit) => unit switch
    {
        LabUnit.NONE => "", LabUnit.PERCENT => "%", LabUnit.G_PER_DL => "g/dL", LabUnit.MG_PER_DL => "mg/dL",
        LabUnit.UG_PER_DL => "µg/dL", LabUnit.NG_PER_ML => "ng/mL", LabUnit.MMOL_PER_L => "mmol/L", LabUnit.MOL_PER_L => "mol/L",
        LabUnit.U_PER_L => "U/L", LabUnit.IU_PER_L => "IU/L", LabUnit.K_U_PER_L => "kU/L", LabUnit.X10_3_PER_UL => "x10^3/µL",
        LabUnit.X10_6_PER_UL => "x10^6/µL", LabUnit.CELLS_PER_UL => "cél/µL", LabUnit.PLATELETS_PER_UL => "plt/µL",
        LabUnit.FL => "%fL", LabUnit.PG => "pg", LabUnit.G_PER_L => "g/L", LabUnit.MG_PER_L => "mg/L",
        LabUnit.UMOL_PER_L => "µmol/L", LabUnit.MS => "ms", LabUnit.SEC => "s", _ => "min",
    };
}
