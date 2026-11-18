namespace VetSaas.Modules.Clinic.Domain;

/// <summary>Unidades de tiempo para recordatorios y duraciones.</summary>
public enum TimeUnit { DAYS, WEEKS, MONTHS }

public enum AdmissionTiming { BEFORE_ATTENTION, DURING_ATTENTION, AFTER_ATTENTION, NONE }
public enum AnestheticPhase { PREMEDICATION, INDUCTION, MAINTENANCE }
public enum AppointmentStatus { REQUESTED, SCHEDULED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELED, NO_SHOW }
public enum AppointmentType { CLINIC, GROOMING, SURGERY }
public enum AttentionsStatus { WAITING, IN_CONSULTATION, IN_PROGRESS, FINISHED }
public enum AttentionType { CLINIC, GROOMING, SURGERY }
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


public enum LabValueType { NUMERIC, TEXT, BOOLEAN, SELECT }


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
}
