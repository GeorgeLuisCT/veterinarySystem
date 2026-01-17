package com.gaedet.veterinarysystem.core.finance.dto.request;

import lombok.Data;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreateAccountMovementRequest {

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal amount;

    private String description;

    private LocalDateTime movementDate;

    /**
     * Indicates if the movement is income (true) or expense (false). Only used for manual entries.
     */
    private Boolean income = Boolean.TRUE;
}
