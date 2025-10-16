package com.gaedet.biocampovet.core.cash.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethodResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal percentageExtra;
    private BigDecimal percentageDiscount;
    private Boolean isActive;
}