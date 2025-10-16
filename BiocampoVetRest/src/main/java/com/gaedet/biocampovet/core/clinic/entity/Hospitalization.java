package com.gaedet.biocampovet.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.animal.entity.Animal;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cage_id", nullable = false)
    private Cage cage;

    @Column(nullable = false)
    private LocalDateTime admissionDate;

    private LocalDateTime dischargeDate;

    @Column(nullable = false)
    private String reasonForAdmission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HospitalizationStatus status;

    @OneToMany(mappedBy = "hospitalization", cascade = CascadeType.ALL)
    private List<EvolutionNote> evolutionNotes;

    @OneToMany(mappedBy = "hospitalization", cascade = CascadeType.ALL)
    private List<TreatmentSchedule> treatmentSchedules;
}