package com.gaedet.biocampovet.core.sales.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class SaleSummaryLine {
    Long saleId;
    String itemDescription;
    BigDecimal quantity;
    BigDecimal unitPrice;
    BigDecimal totalAmount;
    LocalDateTime soldAt;
    String document;
}

