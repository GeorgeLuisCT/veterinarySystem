package com.gaedet.biocampovet.core.sales.dto.request;

import com.gaedet.biocampovet.core.sales.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalePaymentRequest {

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal amount;

    @NotNull
    private PaymentMethod method;

    private LocalDateTime paidAt;

    private String reference;

    private String notes;
}

