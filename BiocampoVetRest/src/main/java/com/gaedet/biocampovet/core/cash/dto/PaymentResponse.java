package com.gaedet.biocampovet.core.cash.dto;

import com.gaedet.biocampovet.core.cash.enums.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private PaymentType paymentType;
    private String method;
    private BigDecimal amount;
    private String description;
    private String operationNumber;
    private String documentReference;
    private String receivedBy;
    private LocalDateTime paidAt;
    private String notes;
}