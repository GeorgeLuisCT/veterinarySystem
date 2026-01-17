package com.gaedet.veterinarysystem.core.finance.dto.response;

import com.gaedet.veterinarysystem.core.finance.enums.TreasuryAccountType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class TreasuryAccountResponse {
    Long id;
    String name;
    TreasuryAccountType type;
    String description;
    boolean active;
    BigDecimal currentBalance;
}
