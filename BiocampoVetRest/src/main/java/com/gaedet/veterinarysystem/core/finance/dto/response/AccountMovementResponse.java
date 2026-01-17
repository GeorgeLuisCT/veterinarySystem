package com.gaedet.veterinarysystem.core.finance.dto.response;

import com.gaedet.veterinarysystem.core.finance.enums.AccountMovementType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class AccountMovementResponse {
    Long id;
    Long treasuryAccountId;
    String treasuryAccountName;
    LocalDateTime movementDate;
    BigDecimal amount;
    String description;
    AccountMovementType movementType;
    String reference;
}
