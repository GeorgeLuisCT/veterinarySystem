package com.gaedet.biocampovet.core.finance.dto.response;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Value
@Builder
public class AccountPayablePaymentResponse {
    Long id;
    BigDecimal amount;
    LocalDateTime paymentDateTime;
    Long treasuryAccountId;
    String treasuryAccountName;
    String notes;
}
