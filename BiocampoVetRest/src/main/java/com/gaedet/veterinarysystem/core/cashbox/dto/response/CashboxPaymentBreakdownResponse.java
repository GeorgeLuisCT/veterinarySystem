package com.gaedet.veterinarysystem.core.cashbox.dto.response;

import com.gaedet.veterinarysystem.core.sales.enums.PaymentMethod;
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