package com.gaedet.veterinarysystem.core.clinic.entity;

import lombok.*;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Plantillas de recetas para agilizar la prescripción de tratamientos comunes.
 */
@Entity
@Table(name = "prescription_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String purpose;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(
            mappedBy = "prescriptionTemplate",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<PrescriptionTemplateMedication> medications = new ArrayList<>();
}
