package com.gaedet.biocampovet.core.sales.dto.response;

import com.gaedet.biocampovet.core.sales.enums.PaymentMethod;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class SalePaymentResponse {
    Long id;
    BigDecimal amount;
    PaymentMethod method;
    LocalDateTime paidAt;
    String reference;
    String notes;
    Long cashSessionId;
}

