package com.gaedet.biocampovet.core.cashbox.dto.response;

import com.gaedet.biocampovet.core.sales.enums.PaymentMethod;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class CashboxPaymentBreakdownResponse {
    PaymentMethod paymentMethod;
    String label;
    BigDecimal amount;
}