package com.gaedet.biocampovet.core.cash.dto;

import com.gaedet.biocampovet.core.cash.enums.ChasboxMovementReason;
import com.gaedet.biocampovet.core.cash.enums.CashboxMovementType;
import com.gaedet.biocampovet.core.users.dto.UserSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CahboxMovementResponse {
    private Long id;
    private CashboxMovementType type;
    private ChasboxMovementReason reason;
    private String paymentMethodName;
    private BigDecimal amount;
    private String description;
    private String documentReference;
    private String operationNumber;
    private String notes;
    private LocalDateTime registeredAt;
    private UserSummaryResponse userSummaryResponse;
}
