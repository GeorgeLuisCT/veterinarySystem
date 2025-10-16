package com.gaedet.biocampovet.core.cash.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CashboxAuditPaymentMethodResponse {

    private PaymentMethodResponse paymentMethod;
    private BigDecimal expectedAmount;
    private BigDecimal countedAmount;
}
