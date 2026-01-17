package com.gaedet.veterinarysystem.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import lombok.*;

/**
 * Estado por sucursal de un servicio del catálogo.
 * Si 'ClinicalService.isActive' = false, este registro no puede "reactivarlo":
 * la activación efectiva = global && por sucursal.
 */
@Entity
@Table(
        name = "branch_clinical_services",
        uniqueConstraints = @UniqueConstraint(name = "uk_branch_service", columnNames = {"branch_id", "clinical_service_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BranchClinicalService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clinical_service_id", nullable = false)
    private ClinicalService clinicalService;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
