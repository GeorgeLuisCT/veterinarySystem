package com.gaedet.biocampovet.core.payments.dto.response;

import com.gaedet.biocampovet.core.payments.enums.CashSessionStatus;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class CashSessionSummaryResponse {
    Long id;
    Long branchId;
    String branchName;
    Long cashierId;
    String cashierName;
    CashSessionStatus status;
    LocalDateTime openedAt;
    LocalDateTime closedAt;
    BigDecimal openingAmount;
    BigDecimal totalCashSales;
    BigDecimal totalIncomeMovements;
    BigDecimal totalExpenseMovements;
    BigDecimal calculatedClosingAmount;
    BigDecimal countedClosingAmount;
    BigDecimal differenceAmount;
    String notes;
}

