package com.gaedet.biocampovet.core.cash.dto;

import com.gaedet.biocampovet.core.cash.enums.CashBoxStatus;
import com.gaedet.biocampovet.core.users.dto.UserSummaryResponse;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class CashboxResponse {
    private Long id;
    private String branchName;

    private UserSummaryResponse openedBy;
    private UserSummaryResponse closedBy;

    private BigDecimal initialAmount;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;

    private CashBoxStatus status;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal physicalAmount;

    private String closingObservations;

    private List<PaymentResponse> payments;
    private List<CahboxMovementResponse> movements;
    private List<CashboxAuditResponse> audits;
}
