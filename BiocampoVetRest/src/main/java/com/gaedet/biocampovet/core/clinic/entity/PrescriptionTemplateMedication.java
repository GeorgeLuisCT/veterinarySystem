package com.gaedet.biocampovet.core.clinic.entity;

import com.gaedet.biocampovet.core.clinic.enums.FrequencyUnit;
import com.gaedet.biocampovet.core.global.enums.TimeUnit;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;

/**
 * Medicamento definido dentro de una plantilla de receta.
 */
@Entity
@Table(name = "prescription_template_medications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplateMedication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prescription_template_id", nullable = false)
    private PrescriptionTemplate prescriptionTemplate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "custom_medication_name")
    private String customMedicationName;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal dosageAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "dosage_unit")
    private ProductUnitType dosageUnit;

    @Column(name = "frequency_value", nullable = false)
    private Integer frequencyValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency_unit", nullable = false, length = 20)
    private FrequencyUnit frequencyUnit;

    @Column(name = "duration_value", nullable = false)
    private Integer durationValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "duration_unit", nullable = false, length = 20)
    private TimeUnit durationUnit;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @PrePersist
    @PreUpdate
    private void validateState() {
        String trimmed = customMedicationName == null ? null : customMedicationName.trim();
        customMedicationName = trimmed == null || trimmed.isEmpty() ? null : trimmed;

        if (product == null && customMedicationName == null) {
            throw new IllegalStateException("Debe indicar un producto de inventario o un nombre de medicamento personalizado.");
        }
        if (product != null && dosageUnit == null) {
            throw new IllegalStateException("La unidad de dosificación es obligatoria cuando se asocia un producto de inventario.");
        }
        if (dosageAmount == null) {
            throw new IllegalStateException("La dosis es obligatoria.");
        }
        if (frequencyValue == null || frequencyValue <= 0) {
            throw new IllegalStateException("La frecuencia debe ser mayor a cero.");
        }
        if (durationValue == null || durationValue <= 0) {
            throw new IllegalStateException("La duración debe ser mayor a cero.");
        }
    }
}
