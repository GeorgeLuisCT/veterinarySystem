package com.gaedet.biocampovet.core.cashbox.dto.response;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class CashSessionHistoryResponse {
    Long id;
    Long branchId;
    String branchName;
    Long cashierId;
    String cashierName;
    LocalDateTime openedAt;
    LocalDateTime closedAt;
    BigDecimal openingAmount;
    BigDecimal calculatedClosingAmount;
    BigDecimal countedClosingAmount;
    BigDecimal differenceAmount;
    String notes;
}

