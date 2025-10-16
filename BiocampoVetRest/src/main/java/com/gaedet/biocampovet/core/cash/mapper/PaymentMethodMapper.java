package com.gaedet.biocampovet.core.cash.mapper;

import com.gaedet.biocampovet.core.cash.dto.PaymentMethodRequest;
import com.gaedet.biocampovet.core.cash.dto.PaymentMethodResponse;
import com.gaedet.biocampovet.core.cash.entity.PaymentMethod;
import org.springframework.stereotype.Component;

@Component
public class PaymentMethodMapper {

    public PaymentMethodResponse toResponse(PaymentMethod entity) {
        if (entity == null) return null;

        return PaymentMethodResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .percentageExtra(entity.getPercentageExtra())
                .percentageDiscount(entity.getPercentageDiscount())
                .isActive(entity.getIsActive())
                .build();
    }

    public PaymentMethod toEntity(PaymentMethodRequest request) {
        if (request == null) return null;

        return PaymentMethod.builder()
                .name(request.getName())
                .description(request.getDescription())
                .percentageExtra(request.getPercentageExtra())
                .percentageDiscount(request.getPercentageDiscount())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    public void updateEntity(PaymentMethod entity, PaymentMethodRequest request) {
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setPercentageExtra(request.getPercentageExtra());
        entity.setPercentageDiscount(request.getPercentageDiscount());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : entity.getIsActive());
    }
}
