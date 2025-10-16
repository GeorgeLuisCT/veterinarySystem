package com.gaedet.biocampovet.core.cash.service;

import com.gaedet.biocampovet.core.cash.dto.PaymentMethodRequest;
import com.gaedet.biocampovet.core.cash.dto.PaymentMethodResponse;
import com.gaedet.biocampovet.core.cash.entity.PaymentMethod;
import com.gaedet.biocampovet.core.cash.repository.PaymentMethodRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;

    public PaymentMethodService(PaymentMethodRepository paymentMethodRepository) {
        this.paymentMethodRepository = paymentMethodRepository;
    }

    public List<PaymentMethodResponse> getAll() {
        return paymentMethodRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PaymentMethodResponse> getAllActive() {
        return paymentMethodRepository.findAllByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentMethodResponse getById(Long id) {
        return paymentMethodRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    public PaymentMethodResponse save(PaymentMethodRequest request) {
        PaymentMethod method = convertToEntity(request);
        method.setIsActive(true);
        return convertToDTO(paymentMethodRepository.save(method));
    }

    public PaymentMethodResponse updateName(Long id, String newName) {
        return paymentMethodRepository.findById(id).map(method -> {
            method.setName(newName);
            return convertToDTO(paymentMethodRepository.save(method));
        }).orElse(null);
    }

    public boolean softDelete(Long id) {
        return paymentMethodRepository.findById(id).map(method -> {
            method.setIsActive(false);
            paymentMethodRepository.save(method);
            return true;
        }).orElse(false);
    }

    public boolean restore(Long id) {
        return paymentMethodRepository.findById(id).map(method -> {
            method.setIsActive(true);
            paymentMethodRepository.save(method);
            return true;
        }).orElse(false);
    }

    public boolean hardDelete(Long id) {
        if (!paymentMethodRepository.existsById(id)) {
            return false;
        }
        paymentMethodRepository.deleteById(id);
        return true;
    }

    private PaymentMethod convertToEntity(PaymentMethodRequest request) {
        return PaymentMethod.builder()
                .name(request.getName())
                .description(request.getDescription())
                .percentageExtra(request.getPercentageExtra())
                .percentageDiscount(request.getPercentageDiscount())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    private PaymentMethodResponse convertToDTO(PaymentMethod entity) {
        return PaymentMethodResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .percentageExtra(entity.getPercentageExtra())
                .percentageDiscount(entity.getPercentageDiscount())
                .isActive(entity.getIsActive())
                .build();
    }
}