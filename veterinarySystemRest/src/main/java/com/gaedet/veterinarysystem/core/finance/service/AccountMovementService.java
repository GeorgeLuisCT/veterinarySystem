package com.gaedet.veterinarysystem.core.finance.service;

import com.gaedet.veterinarysystem.core.finance.entity.AccountMovement;
import com.gaedet.veterinarysystem.core.finance.entity.TreasuryAccount;
import com.gaedet.veterinarysystem.core.finance.enums.AccountMovementType;
import com.gaedet.veterinarysystem.core.finance.repository.AccountMovementRepository;
import com.gaedet.veterinarysystem.core.finance.repository.TreasuryAccountRepository;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AccountMovementService {

    private final AccountMovementRepository accountMovementRepository;
    private final TreasuryAccountRepository treasuryAccountRepository;

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    @Transactional
    public AccountMovement registerMovement(Long treasuryAccountId,
                                            BigDecimal rawAmount,
                                            AccountMovementType movementType,
                                            String description,
                                            LocalDateTime movementDate,
                                            String reference) {

        if (rawAmount == null || rawAmount.compareTo(BigDecimal.ZERO) == 0) {
            throw new BadRequestException("El monto del movimiento debe ser distinto de cero");
        }

        // Bloqueo de fila: dos retiros simultáneos no pueden dejar la cuenta en negativo
        TreasuryAccount account = treasuryAccountRepository.findByIdForUpdate(treasuryAccountId)
                .orElseThrow(() -> new EntityNotFoundException("Cuenta de tesorería no encontrada"));

        if (Boolean.FALSE.equals(account.getActive())) {
            throw new BadRequestException("La cuenta de tesorería '" + account.getName() + "' está inactiva");
        }

        BigDecimal normalizedAmount = rawAmount.setScale(MONEY_SCALE, ROUNDING_MODE);
        if (normalizedAmount.compareTo(BigDecimal.ZERO) < 0) {
            BigDecimal balance = getCurrentBalance(treasuryAccountId);
            if (balance.add(normalizedAmount).compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Saldo insuficiente en '" + account.getName() + "': disponible "
                        + balance + ", se intenta retirar " + normalizedAmount.abs());
            }
        }

        AccountMovement movement = AccountMovement.builder()
                .treasuryAccount(account)
                .movementType(movementType)
                .description(description)
                .movementDate(movementDate)
                .reference(reference)
                .amount(normalizedAmount)
                .build();

        return accountMovementRepository.save(movement);
    }

    @Transactional(readOnly = true)
    public BigDecimal getCurrentBalance(Long treasuryAccountId) {
        BigDecimal total = accountMovementRepository.sumAmountByTreasuryAccountId(treasuryAccountId);
        return total == null ? BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING_MODE) : total.setScale(MONEY_SCALE, ROUNDING_MODE);
    }
}
