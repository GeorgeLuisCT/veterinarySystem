package com.gaedet.biocampovet.core.cashbox.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloseCashSessionRequest {

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true)
    private BigDecimal countedClosingAmount;

    private String notes;
}

