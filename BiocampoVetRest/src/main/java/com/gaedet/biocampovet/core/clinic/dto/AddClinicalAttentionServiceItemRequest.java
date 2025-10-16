package com.gaedet.biocampovet.core.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddClinicalAttentionServiceItemRequest {

    @NotNull
    private Long clinicalServiceId;

    @NotNull
    private BigDecimal unitPrice;

    @NotNull
    private BigDecimal quantity;

    private String notes;
}
