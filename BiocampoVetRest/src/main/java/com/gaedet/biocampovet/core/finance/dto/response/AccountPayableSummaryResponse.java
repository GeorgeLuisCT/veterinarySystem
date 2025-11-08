package com.gaedet.biocampovet.core.finance.dto.response;

import com.gaedet.biocampovet.core.finance.enums.AccountPayableStatus;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;

@Value
@Builder
public class AccountPayableSummaryResponse {
    Long id;
    Long supplierId;
    String supplierName;
    String description;
    LocalDate issueDate;
    BigDecimal totalAmount;
    BigDecimal amountPaid;
    AccountPayableStatus status;
}
