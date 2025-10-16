package com.gaedet.biocampovet.core.cash.mapper;

import com.gaedet.biocampovet.core.cash.dto.PaymentResponse;
import com.gaedet.biocampovet.core.cash.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment entity) {
        if (entity == null) return null;

        return new PaymentResponse(
                entity.getId(),
                entity.getType(),
                entity.getPaymentMethod().getName(),
                entity.getAmount(),
                entity.getDescription(),
                entity.getOperationNumber(),
                entity.getDocumentReference(),
                entity.getReceivedBy(),
                entity.getPaidAt(),
                entity.getNotes()
        );
    }
}
