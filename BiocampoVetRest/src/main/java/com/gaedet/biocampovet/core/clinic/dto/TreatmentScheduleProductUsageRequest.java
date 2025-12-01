package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
public class TreatmentScheduleProductUsageRequest {
    @NotNull
    private Long productId;

    @NotNull
    @DecimalMin(value = "0.0001", message = "La cantidad debe ser mayor que cero")
    private BigDecimal quantity;

    @NotNull
    private ProductUnitType unit;
}
