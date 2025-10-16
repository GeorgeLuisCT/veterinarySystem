package com.gaedet.biocampovet.core.clinic.entity;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.branches.entity.Laboratory;
import com.gaedet.biocampovet.core.clinic.enums.LabRequestStatus;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "laboratory_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaboratoryRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinical_attention_id")
    private ClinicalAttention clinicalAttention;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requesting_employee_id")
    private Employee requestingEmployee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "laboratory_id", nullable = false)
    private Laboratory laboratory;

    @Enumerated(EnumType.STRING)
    @Column(length = 24, nullable = false)
    private LabRequestStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String clinicalNotes;

    @OneToMany(mappedBy = "laboratoryRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<LaboratoryRequestItem> items = new HashSet<>();
}
