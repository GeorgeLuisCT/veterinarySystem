package com.gaedet.veterinarysystem.core.finance.dto.response;

import com.gaedet.veterinarysystem.core.finance.enums.AccountPayableStatus;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class AccountPayableSummaryResponse {
    Long id;
    Long supplierId;
    String supplierName;
    String description;
    LocalDateTime issueDateTime;
    BigDecimal totalAmount;
    BigDecimal amountPaid;
    AccountPayableStatus status;
}
