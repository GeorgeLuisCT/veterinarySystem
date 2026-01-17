package com.gaedet.veterinarysystem.core.clinic.dto.history;

import com.gaedet.veterinarysystem.core.animal.enums.AnimalSex;
import com.gaedet.veterinarysystem.core.animal.enums.AnimalSpecies;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.veterinarysystem.core.clinic.enums.GroomingStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationCause;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Getter
@Builder
public class ClinicalHistoryDetailResponse {

    private final PatientInfo patient;
    private final Consultation lastConsultation;
    private final List<Consultation> consultations;
    private final List<Procedure> procedures;
    private final PreventiveCare preventiveCare;
    private final List<LabResult> labResults;
    private final List<WeightEntry> weightHistory;
    private final List<HospitalizationRecord> hospitalizations;

    @Getter
    @Builder
    public static class PatientInfo {
        private final Long animalId;
        private final String name;
        private final String photoUrl;
        private final AnimalSpecies species;
        private final String speciesLabel;
        private final String breed;
        private final AnimalSex sex;
        private final String sexLabel;
        private final LocalDate birthDate;
        private final String age;
        private final String microchip;
        private final boolean active;
        private final Set<String> allergies;
        private final Set<String> chronicConditions;
        private final OwnerInfo owner;
        private final LocalDateTime lastVisitDate;
        private final String lastVisitService;
        private final String lastVeterinarian;
    }

    @Getter
    @Builder
    public static class OwnerInfo {
        private final Long id;
        private final String name;
        private final String email;
        private final String phoneNumber;
        private final String address;
        private final String documentType;
        private final String documentNumber;
    }

    @Getter
    @Builder
    public static class Consultation {
        private final Long id;
        private final LocalDateTime visitDate;
        private final ClinicalServiceCategory serviceCategory;
        private final String clinicalServiceName;
        private final String veterinarian;
        private final String branchName;
        private final String reasonForVisit;
        private final Vitals vitals;
        private final String subjective;
        private final String objective;
        private final String diagnosis;
        private final String treatment;
        private final String notes;
        private final List<Medication> medications;
        private final List<ServiceItem> additionalServices;
    }

    @Getter
    @Builder
    public static class Vitals {
        private final Double weightKg;
        private final Double temperatureCelsius;
        private final Integer heartRate;
        private final Integer respiratoryRate;
    }

    @Getter
    @Builder
    public static class Medication {
        private final Long id;
        private final String productName;
        private final BigDecimal doseAmount;
        private final String doseUnit;
        private final String route;
        private final Integer frequencyValue;
        private final String frequencyUnit;
        private final LocalDateTime administeredAt;
        private final String administeredBy;
        private final String notes;
    }

    @Getter
    @Builder
    public static class ServiceItem {
        private final Long id;
        private final String clinicalServiceName;
        private final ClinicalServiceCategory category;
        private final BigDecimal quantity;
        private final BigDecimal subtotal;
        private final String notes;
    }

    @Getter
    @Builder
    public static class Procedure {
        private final Long id;
        private final ProcedureType type;
        private final String title;
        private final LocalDateTime startedAt;
        private final LocalDateTime endedAt;
        private final String professionalInCharge;
        private final String notes;
        private final String status;
    }

    public enum ProcedureType {
        SURGERY,
        HOSPITALIZATION
    }

    @Getter
    @Builder
    public static class PreventiveCare {
        private final List<PreventiveEvent> vaccines;
        private final List<PreventiveEvent> deworming;
        private final List<GroomingEntry> groomingSessions;
    }

    @Getter
    @Builder
    public static class PreventiveEvent {
        private final Long serviceItemId;
        private final String serviceName;
        private final ClinicalServiceCategory category;
        private final LocalDateTime performedAt;
        private final LocalDate nextDueDate;
        private final String veterinarian;
        private final String notes;
    }

    @Getter
    @Builder
    public static class GroomingEntry {
        private final Long id;
        private final String serviceName;
        private final GroomingStatus status;
        private final LocalDateTime startedAt;
        private final LocalDateTime finishedAt;
        private final String assignedProfessional;
        private final String behaviorNotes;
        private final String clinicalObservations;
    }

    @Getter
    @Builder
    public static class LabResult {
        private final Long requestId;
        private final String laboratoryName;
        private final String requestingVeterinarian;
        private final LocalDateTime requestedAt;
        private final LocalDateTime reportedAt;
        private final LabRequestStatus status;
        private final String testName;
        private final String clinicalNotes;
        private final List<LabParameter> parameters;
    }

    @Getter
    @Builder
    public static class LabParameter {
        private final String name;
        private final String value;
        private final String unit;
        private final String referenceRange;
        private final String flag;
        private final String comment;
    }

    @Getter
    @Builder
    public static class WeightEntry {
        private final LocalDateTime recordedAt;
        private final Double weightKg;
        private final Long sourceClinicalAttentionId;
    }

    @Getter
    @Builder
    public static class HospitalizationRecord {
        private final Long id;
        private final LocalDateTime admissionDate;
        private final LocalDateTime dischargeDate;
        private final HospitalizationStatus status;
        private final HospitalizationCause cause;
        private final String clinicalServiceName;
        private final String attendingEmployee;
        private final String admissionNotes;
        private final List<TreatmentScheduleEntry> treatmentSchedules;
        private final List<EvolutionNoteEntry> evolutionNotes;
    }

    @Getter
    @Builder
    public static class TreatmentScheduleEntry {
        private final Long id;
        private final String treatmentName;
        private final LocalDateTime scheduledTime;
        private final boolean completed;
        private final LocalDateTime completedAt;
        private final String completedBy;
        private final String notes;
        private final List<TreatmentProductUsageEntry> products;
    }

    @Getter
    @Builder
    public static class EvolutionNoteEntry {
        private final Long id;
        private final LocalDateTime timestamp;
        private final String author;
        private final String note;
    }

    @Getter
    @Builder
    public static class TreatmentProductUsageEntry {
        private final Long id;
        private final Long productId;
        private final String productName;
        private final java.math.BigDecimal quantity;
        private final com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType unit;
    }
}
