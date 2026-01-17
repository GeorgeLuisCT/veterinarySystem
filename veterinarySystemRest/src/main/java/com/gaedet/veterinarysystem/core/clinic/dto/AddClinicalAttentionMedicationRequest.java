package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.FrequencyUnit;
import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddClinicalAttentionMedicationRequest {

    @NotNull
    private Long productId;

    @NotNull
    private LocalDateTime administeredAt;

    private BigDecimal doseAmount;
    private ProductUnitType doseUnit;
    private AdministrationRoute route;
    private Integer frequencyValue;
    private FrequencyUnit frequencyUnit;
    private Long administeredByEmployeeId;
    private String notes;
}
