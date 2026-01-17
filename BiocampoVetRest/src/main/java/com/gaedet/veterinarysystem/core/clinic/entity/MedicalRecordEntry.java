package com.gaedet.veterinarysystem.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.clinic.enums.MedicalRecordCategory;
import com.gaedet.veterinarysystem.core.clinic.enums.RecordVisibility;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "medical_record_entries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicalRecordEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private MedicalRecordCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinical_service_id")
    private ClinicalService clinicalService;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(length = 180)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_employee_id")
    private Employee createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private RecordVisibility visibility = RecordVisibility.INTERNAL;
}



