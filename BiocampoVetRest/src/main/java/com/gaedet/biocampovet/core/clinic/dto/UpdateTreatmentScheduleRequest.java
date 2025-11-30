package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Getter;
import lombok.Setter;
import javax.validation.constraints.NotNull;

@Getter
@Setter
public class UpdateTreatmentScheduleRequest {
    @NotNull
    private Boolean isCompleted;
    private Long completedByEmployeeId;
    private String notes;

    private Long productId;
    private java.math.BigDecimal quantity;
    private com.gaedet.biocampovet.core.inventory.enums.ProductUnitType unit;
}
