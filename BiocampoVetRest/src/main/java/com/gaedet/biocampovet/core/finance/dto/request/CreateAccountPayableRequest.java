package com.gaedet.biocampovet.core.finance.dto.request;

import lombok.Data;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CreateAccountPayableRequest {
    private Long supplierId;

    @NotBlank
    private String description;

    @NotNull
    private LocalDateTime issueDateTime;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal totalAmount;
}
