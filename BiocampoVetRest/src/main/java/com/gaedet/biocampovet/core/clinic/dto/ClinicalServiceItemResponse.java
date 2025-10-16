package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ClinicalServiceItemResponse {

    private final Long id;
    private final Long clinicalServiceId;
    private final String clinicalServiceName;
    private final BigDecimal unitPrice;
    private final BigDecimal quantity;
    private final BigDecimal subtotal;
    private final String notes;
}
