package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.FrequencyUnit;
import com.gaedet.veterinarysystem.core.global.enums.TimeUnit;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplateMedicationResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String customMedicationName;
    private BigDecimal dosageAmount;
    private ProductUnitType dosageUnit;
    private Integer frequencyValue;
    private FrequencyUnit frequencyUnit;
    private Integer durationValue;
    private TimeUnit durationUnit;
    private String instructions;
}
