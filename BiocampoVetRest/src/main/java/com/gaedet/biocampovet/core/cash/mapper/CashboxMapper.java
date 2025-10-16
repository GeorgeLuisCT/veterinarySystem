package com.gaedet.biocampovet.core.cash.mapper;

import com.gaedet.biocampovet.core.cash.dto.CashboxResponse;
import com.gaedet.biocampovet.core.cash.entity.Cashbox;
import com.gaedet.biocampovet.core.users.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CashboxMapper {

    private final PaymentMapper paymentMapper;
    private final CashboxMovementMapper cashboxMovementMapper;
    private final CashboxAuditMapper auditMapper;
    private final UserMapper userMapper;

    public CashboxResponse toResponse(Cashbox entity) {
        if (entity == null) return null;

        CashboxResponse dto = new CashboxResponse();
        dto.setId(entity.getId());
        dto.setBranchName(entity.getBranch().getName());
        dto.setOpenedBy(userMapper.toSummary(entity.getOpenedBy()));
        dto.setClosedBy(userMapper.toSummary(entity.getClosedBy()));
        dto.setInitialAmount(entity.getInitialAmount());
        dto.setOpenedAt(entity.getOpenedAt());
        dto.setClosedAt(entity.getClosedAt());
        dto.setStatus(entity.getStatus());
        dto.setTotalIncome(entity.getTotalIncome());
        dto.setTotalExpense(entity.getTotalExpense());
        dto.setPhysicalAmount(entity.getPhysicalAmount());
        dto.setClosingObservations(entity.getClosingObservations());

        if (entity.getPayments() != null) {
            dto.setPayments(entity.getPayments().stream()
                    .map(paymentMapper::toResponse)
                    .toList());
        }

        if (entity.getCashboxMovements() != null) {
            dto.setMovements(entity.getCashboxMovements().stream()
                    .map(cashboxMovementMapper::toResponse)
                    .toList());
        }

        if (entity.getAudits() != null) {
            dto.setAudits(entity.getAudits().stream()
                    .map(auditMapper::toResponse)
                    .toList());
        }

        return dto;
    }
}

