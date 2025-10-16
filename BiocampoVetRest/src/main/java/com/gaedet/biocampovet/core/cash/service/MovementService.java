package com.gaedet.biocampovet.core.cash.service;

import com.gaedet.biocampovet.core.cash.dto.CashboxMovementRequest;
import com.gaedet.biocampovet.core.cash.entity.Cashbox;
import com.gaedet.biocampovet.core.cash.entity.CashboxMovement;
import com.gaedet.biocampovet.core.cash.entity.PaymentMethod;
import com.gaedet.biocampovet.core.cash.enums.CashBoxStatus;
import com.gaedet.biocampovet.core.cash.mapper.CashboxMovementMapper;
import com.gaedet.biocampovet.core.cash.repository.CashboxRepository;
import com.gaedet.biocampovet.core.cash.repository.CashboxMovementRepository;
import com.gaedet.biocampovet.core.cash.repository.PaymentMethodRepository;
import com.gaedet.biocampovet.core.users.entity.User;
import com.gaedet.biocampovet.core.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional
public class MovementService {

    private final CashboxRepository cashBoxRepository;
    private final UserRepository userRepository;
    private final CashboxMovementRepository cashboxMovementRepository;
    private final CashboxMovementMapper cashboxMovementMapper;
    private final PaymentMethodRepository paymentMethodRepository;

    public Long registerMovement(CashboxMovementRequest request, Long userId) {
        Cashbox cashBox = cashBoxRepository.findById(request.getCashboxId())
                .orElseThrow(() -> new NoSuchElementException("Caja no encontrada"));

        if (cashBox.getStatus() != CashBoxStatus.OPEN) {
            throw new IllegalStateException("No se puede registrar un movimiento en una caja cerrada");
        }

        User user = userRepository.getReferenceById(userId);
        PaymentMethod paymentMethod = paymentMethodRepository.findById(request.getPaymentMethodId())
                .orElseThrow(() -> new NoSuchElementException("Método de pago no encontrado"));

        CashboxMovement cashboxMovement = cashboxMovementMapper.toEntity(request, cashBox, paymentMethod, user);
        CashboxMovement saved = cashboxMovementRepository.save(cashboxMovement);
        return saved.getId();
    }

}

