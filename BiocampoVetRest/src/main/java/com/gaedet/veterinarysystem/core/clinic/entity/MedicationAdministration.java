package com.gaedet.veterinarysystem.core.clinic.entity;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.clinic.enums.FrequencyUnit;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "medication_administrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicationAdministration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private LocalDateTime administeredAt;

    @Column(precision = 10, scale = 2)
    private BigDecimal doseAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private ProductUnitType doseUnit;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private AdministrationRoute route;

    @Column(name = "frequency_value")
    private Integer frequencyValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency_unit", length = 20)
    private FrequencyUnit frequencyUnit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "administered_by_employee_id")
    private Employee administeredBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinical_attention_id")
    private ClinicalAttention clinicalAttention;
}
