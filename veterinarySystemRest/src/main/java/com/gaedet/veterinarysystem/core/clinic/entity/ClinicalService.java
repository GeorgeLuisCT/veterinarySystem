package com.gaedet.veterinarysystem.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.veterinarysystem.core.global.enums.TimeUnit;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import lombok.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

/**
 * Define un servicio o procedimiento ofrecido por la clínica.
 * Es la base para el catálogo clínico.
 */
@Entity
@Table(name = "clinical_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicalService {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClinicalServiceCategory clinicalServiceCategory;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "reminder_period")
    private Integer reminderPeriod;

    @Enumerated(EnumType.STRING)
    @Column(name = "reminder_period_unit")
    private TimeUnit reminderPeriodUnit;

    @ElementCollection
    @CollectionTable(
            name = "clinical_service_required_sample_types",
            joinColumns = @JoinColumn(name = "clinical_service_id")
    )
    @Column(name = "sample_type", nullable = false)
    @Builder.Default
    private Set<String> requiredSampleTypes = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "clinical_service_required_products",
            joinColumns = @JoinColumn(name = "clinical_service_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    @Builder.Default
    private Set<Product> requiredProducts = new HashSet<>();

    @OneToMany(mappedBy = "clinicalService", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<BranchClinicalService> branchLinks = new HashSet<>();
}
