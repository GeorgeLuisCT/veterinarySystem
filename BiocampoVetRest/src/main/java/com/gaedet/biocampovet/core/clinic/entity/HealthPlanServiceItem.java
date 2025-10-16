package com.gaedet.biocampovet.core.clinic.entity;

import lombok.*;

import javax.persistence.*;

/**
 * Servicio incluido dentro de un plan de salud.
 */
@Entity
@Table(name = "health_plan_service_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthPlanServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "health_plan_id", nullable = false)
    private HealthPlan healthPlan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clinical_service_id", nullable = false)
    private ClinicalService clinicalService;

    @Column(nullable = false)
    private Integer quantity;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    @PreUpdate
    private void validateState() {
        if (clinicalService == null) {
            throw new IllegalStateException("Cada elemento debe asociarse a un servicio clínico.");
        }
        if (quantity == null || quantity <= 0) {
            throw new IllegalStateException("La cantidad debe ser mayor a cero.");
        }
        String trimmedNotes = notes == null ? null : notes.trim();
        notes = (trimmedNotes == null || trimmedNotes.isEmpty()) ? null : trimmedNotes;
    }
}
