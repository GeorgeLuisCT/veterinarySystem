package com.gaedet.biocampovet.core.finance.dto.request;

import lombok.Data;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class RegisterPaymentRequest {

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal amount;

    @NotNull
    private Long treasuryAccountId;

    private LocalDateTime paymentDateTime;

    private String notes;
}
