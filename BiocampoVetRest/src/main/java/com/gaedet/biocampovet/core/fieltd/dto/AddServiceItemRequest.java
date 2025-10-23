package com.gaedet.biocampovet.core.fieltd.dto;

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
public class AddServiceItemRequest {
    @NotNull
    private Long clinicalServiceId;
    @NotNull
    @Min(1)
    private Integer quantity;
    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal unitPrice;
    private Long performedById;
    private String notes;
}
