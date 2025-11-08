package com.gaedet.biocampovet.core.cashbox.dto.response;

import com.gaedet.biocampovet.core.cashbox.enums.CashMovementType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class CashMovementResponse {
    Long id;
    CashMovementType movementType;
    BigDecimal amount;
    String reason;
    Long registeredById;
    String registeredByName;
    LocalDateTime registeredAt;
    String reference;
}

