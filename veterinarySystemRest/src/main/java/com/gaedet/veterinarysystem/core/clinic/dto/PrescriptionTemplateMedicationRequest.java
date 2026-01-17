package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.FrequencyUnit;
import com.gaedet.veterinarysystem.core.global.enums.TimeUnit;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.*;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplateMedicationRequest {

    private Long productId;

    private String customMedicationName;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false, message = "La dosis debe ser mayor a cero.")
    private BigDecimal dosageAmount;

    private ProductUnitType dosageUnit;

    @NotNull
    @Min(value = 1, message = "La frecuencia debe ser mayor o igual a 1.")
    private Integer frequencyValue;

    @NotNull
    private FrequencyUnit frequencyUnit;

    @NotNull
    @Min(value = 1, message = "La duración debe ser mayor o igual a 1.")
    private Integer durationValue;

    @NotNull
    private TimeUnit durationUnit;

    private String instructions;
}
