package com.gaedet.biocampovet.core.cash.mapper;

import com.gaedet.biocampovet.core.cash.dto.CashboxMovementRequest;
import com.gaedet.biocampovet.core.cash.dto.CahboxMovementResponse;
import com.gaedet.biocampovet.core.cash.entity.Cashbox;
import com.gaedet.biocampovet.core.cash.entity.CashboxMovement;
import com.gaedet.biocampovet.core.cash.entity.PaymentMethod;
import com.gaedet.biocampovet.core.users.entity.User;
import com.gaedet.biocampovet.core.users.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CashboxMovementMapper {

    private final UserMapper userMapper;

    public CashboxMovement toEntity(
            CashboxMovementRequest request,
            Cashbox cashBox,
            PaymentMethod paymentMethod,
            User registeredByUser
    ) {
        CashboxMovement m = new CashboxMovement();
        m.setCashbox(cashBox);
        m.setType(request.getType());
        m.setReason(request.getReason());
        m.setPaymentMethod(paymentMethod);
        m.setAmount(request.getAmount());
        m.setDescription(request.getDescription());
        m.setDocumentReference(request.getDocumentReference());
        m.setOperationNumber(request.getOperationNumber());
        m.setRegisteredByUser(registeredByUser);
        m.setNotes(request.getNotes());
        return m;
    }

    public CahboxMovementResponse toResponse(CashboxMovement entity) {
        if (entity == null) return null;

        return new CahboxMovementResponse(
                entity.getId(),
                entity.getType(),
                entity.getReason(),
                entity.getPaymentMethod().getName(),
                entity.getAmount(),
                entity.getDescription(),
                entity.getDocumentReference(),
                entity.getOperationNumber(),
                entity.getNotes(),
                entity.getRegisteredAt(),
                userMapper.toSummary(entity.getRegisteredByUser())
        );
    }
}
