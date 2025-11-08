package com.gaedet.biocampovet.core.finance.dto.request;

import lombok.Data;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateAccountPayableRequest {
    private Long supplierId;

    @NotBlank
    private String description;

    @NotNull
    private LocalDate issueDate;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal totalAmount;
}
