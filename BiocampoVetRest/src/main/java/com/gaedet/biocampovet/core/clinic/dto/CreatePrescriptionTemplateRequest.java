package com.gaedet.biocampovet.core.clinic.dto;

import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;
import javax.validation.constraints.AssertTrue;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CreatePrescriptionTemplateRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String purpose;

    private String notes;

    @NotEmpty
    @Valid
    private List<PrescriptionTemplateMedicationRequest> medications;

    @AssertTrue(message = "Cada medicamento debe tener un producto o un nombre personalizado.")
    private boolean isMedicationOriginValid() {
        if (medications == null || medications.isEmpty()) {
            return false;
        }
        return medications.stream().allMatch(med -> {
            boolean hasProduct = med.getProductId() != null;
            boolean hasCustom = med.getCustomMedicationName() != null && !med.getCustomMedicationName().trim().isEmpty();
            return hasProduct || hasCustom;
        });
    }

    @AssertTrue(message = "Cuando se seleccione un producto de inventario, la unidad de dosificación es obligatoria.")
    private boolean isDosageUnitValid() {
        if (medications == null) {
            return true;
        }
        return medications.stream()
                .filter(med -> med.getProductId() != null)
                .allMatch(med -> med.getDosageUnit() != null);
    }
}
