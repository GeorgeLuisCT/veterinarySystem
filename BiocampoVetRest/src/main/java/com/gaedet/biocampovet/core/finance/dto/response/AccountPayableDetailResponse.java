package com.gaedet.biocampovet.core.finance.dto.response;

import com.gaedet.biocampovet.core.finance.enums.AccountPayableStatus;
import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class AccountPayableDetailResponse {
    Long id;
    Long supplierId;
    String supplierName;
    String description;
    LocalDateTime issueDateTime;
    BigDecimal totalAmount;
    BigDecimal amountPaid;
    AccountPayableStatus status;
    @Singular
    List<AccountPayablePaymentResponse> payments;
}
