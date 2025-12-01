package com.gaedet.biocampovet.core.clinic.entity;

import javax.persistence.*;
import javax.validation.constraints.AssertTrue;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.clinic.enums.AdmissionTiming;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationCause;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Registro principal de la hospitalización de un animal.
 */
@Entity
@Table(name = "hospitalizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hospitalization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private int version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cage_id", nullable = false)
    private Cage cage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attention_id")
    private Attentions attention;

    @Enumerated(EnumType.STRING)
    @Column(name = "admission_timing", nullable = false, length = 32)
    @Builder.Default
    private AdmissionTiming admissionTiming = AdmissionTiming.NONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "cause", length = 32)
    private HospitalizationCause cause;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinical_service_id")
    private ClinicalService clinicalService;

    @Column(nullable = false)
    private LocalDateTime admissionDate;

    private LocalDateTime dischargeDate;

    @Column(name = "admission_notes", columnDefinition = "TEXT")
    private String admissionNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HospitalizationStatus status;

    @OneToMany(mappedBy = "hospitalization", cascade = CascadeType.ALL)
    private List<EvolutionNote> evolutionNotes;

    @OneToMany(mappedBy = "hospitalization", cascade = CascadeType.ALL)
    private List<TreatmentSchedule> treatmentSchedules;

    @OneToMany(mappedBy = "hospitalization", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("recordedAt DESC")
    private List<HospitalizationVitalSign> vitalSigns;

    @AssertTrue(message = "Si admissionTiming es distinto de NONE, debe existir una atención asociada")
    public boolean timingRequiresAttention() {
        if (admissionTiming == null) return false;
        if (admissionTiming == AdmissionTiming.NONE) return attention == null;
        return attention != null;
    }

    @AssertTrue(message = "El animal de la atención debe coincidir con el animal de la hospitalización")
    public boolean attentionAnimalConsistency() {
        if (attention == null) return true;
        Long a1 = animal != null ? animal.getId() : null;
        Long a2 = attention.getAnimal() != null ? attention.getAnimal().getId() : null;
        return java.util.Objects.equals(a1, a2);
    }

    @AssertTrue(message = "La jaula debe pertenecer a la misma sucursal de la atención")
    public boolean cageBranchConsistencyWithAttention() {
        if (attention == null || cage == null || cage.getBranch() == null) return true;
        Long b1 = attention.getBranch() != null ? attention.getBranch().getId() : null;
        Long b2 = cage.getBranch() != null ? cage.getBranch().getId() : null;
        return java.util.Objects.equals(b1, b2);
    }

    @AssertTrue(message = "La fecha de alta debe ser posterior a la fecha de admisión")
    public boolean dischargeAfterAdmission() {
        if (dischargeDate == null || admissionDate == null) return true;
        return dischargeDate.isAfter(admissionDate);
    }

    @AssertTrue(message = "La causa y el servicio clínico deben ser coherentes cuando ambos están presentes")
    public boolean causeServiceCategoryConsistency() {
        if (cause == null || clinicalService == null) return true;
        ClinicalServiceCategory cat = clinicalService.getClinicalServiceCategory();
        if (cause == HospitalizationCause.PRE_SURGERY || cause == HospitalizationCause.POST_SURGERY) {
            return cat == ClinicalServiceCategory.SURGERY;
        }
        if (cause == HospitalizationCause.POST_GROOMING) {
            return cat == ClinicalServiceCategory.GROOMING;
        }
        if (cause == HospitalizationCause.CLINICAL_OBSERVATION || cause == HospitalizationCause.MEDICATION_MONITORING) {
            return cat == ClinicalServiceCategory.CONSULTATION || cat == ClinicalServiceCategory.SURGERY || cat == ClinicalServiceCategory.GROOMING;
        }
        return true;
    }
}
