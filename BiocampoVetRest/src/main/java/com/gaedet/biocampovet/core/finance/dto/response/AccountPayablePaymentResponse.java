package com.gaedet.biocampovet.core.finance.dto.response;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;

@Value
@Builder
public class AccountPayablePaymentResponse {
    Long id;
    BigDecimal amount;
    LocalDate paymentDate;
    Long treasuryAccountId;
    String treasuryAccountName;
    String notes;
}
