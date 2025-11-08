package com.gaedet.biocampovet.core.cashbox.dto.request;

import com.gaedet.biocampovet.core.cashbox.enums.CashMovementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterCashMovementRequest {

    @NotNull
    private CashMovementType movementType;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal amount;

    @NotBlank
    private String reason;

    @NotNull
    private Long registeredById;

    private String reference;
}

