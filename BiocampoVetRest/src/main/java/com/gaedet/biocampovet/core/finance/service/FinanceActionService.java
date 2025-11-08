package com.gaedet.biocampovet.core.finance.service;

import com.gaedet.biocampovet.core.finance.dto.request.ExpenseRequest;
import com.gaedet.biocampovet.core.finance.dto.request.TransferRequest;
import com.gaedet.biocampovet.core.finance.dto.response.AccountMovementResponse;
import com.gaedet.biocampovet.core.finance.dto.response.TransferResponse;
import com.gaedet.biocampovet.core.finance.entity.AccountMovement;
import com.gaedet.biocampovet.core.finance.enums.AccountMovementType;
import com.gaedet.biocampovet.core.finance.mapper.TreasuryAccountMapper;
import com.gaedet.biocampovet.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class FinanceActionService {

    private final AccountMovementService accountMovementService;

    @Transactional
    public AccountMovementResponse registerExpense(ExpenseRequest request) {
        BigDecimal amount = request.getAmount();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("El monto del gasto debe ser mayor a cero");
        }

        AccountMovement movement = accountMovementService.registerMovement(
                request.getTreasuryAccountId(),
                amount.negate(),
                AccountMovementType.EXPENSE,
                request.getDescription(),
                request.getOccurredAt(),
                null
        );

        return TreasuryAccountMapper.toMovementResponse(movement);
    }

    @Transactional
    public TransferResponse registerTransfer(TransferRequest request) {
        if (request.getSourceAccountId().equals(request.getTargetAccountId())) {
            throw new BadRequestException("Las cuentas origen y destino deben ser diferentes");
        }

        BigDecimal amount = request.getAmount();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("El monto de la transferencia debe ser mayor a cero");
        }

        AccountMovement sourceMovement = accountMovementService.registerMovement(
                request.getSourceAccountId(),
                amount.negate(),
                AccountMovementType.TRANSFER,
                buildTransferDescription(request.getDescription(), false),
                request.getOccurredAt(),
                null
        );

        AccountMovement destinationMovement = accountMovementService.registerMovement(
                request.getTargetAccountId(),
                amount,
                AccountMovementType.TRANSFER,
                buildTransferDescription(request.getDescription(), true),
                request.getOccurredAt(),
                null
        );

        return TransferResponse.builder()
                .sourceMovement(TreasuryAccountMapper.toMovementResponse(sourceMovement))
                .destinationMovement(TreasuryAccountMapper.toMovementResponse(destinationMovement))
                .build();
    }

    private String buildTransferDescription(String base, boolean destination) {
        if (base == null || base.isBlank()) {
            return destination ? "Transferencia entrante" : "Transferencia saliente";
        }
        return base;
    }
}
