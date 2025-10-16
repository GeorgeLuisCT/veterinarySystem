package com.gaedet.biocampovet.core.clinic.dto;

import lombok.*;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthPlanServiceItemRequest {

    @NotNull
    private Long clinicalServiceId;

    @NotNull
    @Min(value = 1, message = "La cantidad debe ser mayor o igual a 1.")
    private Integer quantity;

    private String notes;
}
