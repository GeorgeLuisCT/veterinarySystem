package com.gaedet.biocampovet.core.cash.service;

import com.gaedet.biocampovet.core.cash.dto.CashboxAuditPaymentMethodRequest;
import com.gaedet.biocampovet.core.cash.dto.CashboxAuditRequest;
import com.gaedet.biocampovet.core.cash.entity.Cashbox;
import com.gaedet.biocampovet.core.cash.entity.CashboxAudit;
import com.gaedet.biocampovet.core.cash.entity.PaymentMethod;
import com.gaedet.biocampovet.core.cash.enums.CashBoxStatus;
import com.gaedet.biocampovet.core.cash.mapper.CashboxAuditMapper;
import com.gaedet.biocampovet.core.cash.repository.CashboxAuditRepository;
import com.gaedet.biocampovet.core.cash.repository.CashboxRepository;
import com.gaedet.biocampovet.core.cash.repository.PaymentMethodRepository;
import com.gaedet.biocampovet.core.users.entity.User;
import com.gaedet.biocampovet.core.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional
public class CashboxAuditService {

    private final CashboxRepository cashBoxRepository;
    private final UserRepository userRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final CashboxAuditRepository cashBoxAuditRepository;
    private final CashboxAuditMapper auditMapper;

    public Long registerAudit(CashboxAuditRequest request, Long userId) {
        Cashbox cashBox = cashBoxRepository.findById(request.getCashBoxId())
                .orElseThrow(() -> new NoSuchElementException("Caja no encontrada"));

        if (cashBox.getStatus() != CashBoxStatus.OPEN) {
            throw new IllegalStateException("No se puede auditar una caja que no está abierta");
        }

        User auditor = userRepository.getReferenceById(userId);
        List<PaymentMethod> paymentMethods = paymentMethodRepository.findAllById(
                request.getPaymentMethodAudits().stream()
                        .map(CashboxAuditPaymentMethodRequest::getPaymentMethodId)
                        .toList()
        );

        CashboxAudit audit = auditMapper.toEntity(request, cashBox, auditor, paymentMethods);
        CashboxAudit saved = cashBoxAuditRepository.save(audit);
        return saved.getId();
    }
}

