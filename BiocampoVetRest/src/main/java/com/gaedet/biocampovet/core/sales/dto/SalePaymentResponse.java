package com.gaedet.biocampovet.core.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalePaymentResponse {

    private Long id;
    private Long methodId;
    private String methodName;
    private BigDecimal amount;
}