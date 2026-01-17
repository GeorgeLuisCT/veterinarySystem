package com.gaedet.veterinarysystem.core.finance.mapper;

import com.gaedet.veterinarysystem.core.finance.dto.response.AccountMovementResponse;
import com.gaedet.veterinarysystem.core.finance.dto.response.TreasuryAccountResponse;
import com.gaedet.veterinarysystem.core.finance.entity.AccountMovement;
import com.gaedet.veterinarysystem.core.finance.entity.TreasuryAccount;

import java.math.BigDecimal;

public final class TreasuryAccountMapper {

    private TreasuryAccountMapper() {
    }

    public static TreasuryAccountResponse toResponse(TreasuryAccount entity, BigDecimal balance) {
        if (entity == null) {
            return null;
        }
        return TreasuryAccountResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .type(entity.getType())
                .active(Boolean.TRUE.equals(entity.getActive()))
                .currentBalance(balance == null ? BigDecimal.ZERO : balance)
                .build();
    }

    public static AccountMovementResponse toMovementResponse(AccountMovement movement) {
        if (movement == null) {
            return null;
        }
        return AccountMovementResponse.builder()
                .id(movement.getId())
                .treasuryAccountId(movement.getTreasuryAccount() != null ? movement.getTreasuryAccount().getId() : null)
                .treasuryAccountName(movement.getTreasuryAccount() != null ? movement.getTreasuryAccount().getName() : null)
                .movementDate(movement.getMovementDate())
                .amount(movement.getAmount())
                .description(movement.getDescription())
                .movementType(movement.getMovementType())
                .reference(movement.getReference())
                .build();
    }
}
