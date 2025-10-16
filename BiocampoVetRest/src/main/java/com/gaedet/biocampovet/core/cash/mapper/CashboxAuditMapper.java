package com.gaedet.biocampovet.core.cash.mapper;

import com.gaedet.biocampovet.core.cash.dto.CashboxAuditPaymentMethodResponse;
import com.gaedet.biocampovet.core.cash.dto.CashboxAuditRequest;
import com.gaedet.biocampovet.core.cash.dto.CashboxAuditResponse;
import com.gaedet.biocampovet.core.cash.entity.Cashbox;
import com.gaedet.biocampovet.core.cash.entity.CashboxAudit;
import com.gaedet.biocampovet.core.cash.entity.CashboxAuditPaymentMethod;
import com.gaedet.biocampovet.core.cash.entity.PaymentMethod;
import com.gaedet.biocampovet.core.users.entity.User;
import com.gaedet.biocampovet.core.users.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CashboxAuditMapper {

    private final UserMapper userMapper;
    private final PaymentMethodMapper paymentMethodMapper;

    public CashboxAuditResponse toResponse(CashboxAudit entity) {
        if (entity == null) return null;

        List<CashboxAuditPaymentMethodResponse> paymentMethodResponses = entity.getPaymentMethodAudits()
                .stream()
                .map(this::toPaymentMethodResponse)
                .toList();

        return new CashboxAuditResponse(
                entity.getId(),
                entity.isFinal(),
                entity.getObservations(),
                userMapper.toSummary(entity.getAuditedBy()),
                entity.getAuditedAt(),
                paymentMethodResponses
        );
    }

    public CashboxAuditPaymentMethodResponse toPaymentMethodResponse(CashboxAuditPaymentMethod auditDetail) {
        return new CashboxAuditPaymentMethodResponse(
                paymentMethodMapper.toResponse(auditDetail.getPaymentMethod()),
                auditDetail.getExpectedAmount(),
                auditDetail.getCountedAmount()
        );
    }

    public CashboxAudit toEntity(CashboxAuditRequest request, Cashbox cashBox, User auditor, List<PaymentMethod> paymentMethods) {
        CashboxAudit audit = new CashboxAudit();
        audit.setCashbox(cashBox);
        audit.setFinal(request.getIsFinal());
        audit.setObservations(request.getObservations());
        audit.setAuditedBy(auditor);
        audit.setAuditedAt(LocalDateTime.now());

        List<CashboxAuditPaymentMethod> details = request.getPaymentMethodAudits().stream().map(detail -> {
            PaymentMethod method = paymentMethods.stream()
                    .filter(pm -> pm.getId().equals(detail.getPaymentMethodId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Método de pago no válido: " + detail.getPaymentMethodId()));

            CashboxAuditPaymentMethod d = new CashboxAuditPaymentMethod();
            d.setAudit(audit);
            d.setPaymentMethod(method);
            d.setExpectedAmount(detail.getExpectedAmount());
            d.setCountedAmount(detail.getCountedAmount());
            return d;
        }).toList();

        audit.setPaymentMethodAudits(details);
        return audit;
    }
}

