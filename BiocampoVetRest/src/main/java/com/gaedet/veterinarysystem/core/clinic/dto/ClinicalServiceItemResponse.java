package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalServiceCategory;

import java.math.BigDecimal;
import java.util.List;


public record ClinicalServiceItemResponse(
        Long id,
        Long clinicalServiceId,
        String clinicalServiceName,
        ClinicalServiceCategory clinicalServiceCategory,
        List<ClinicalServiceProductResponse> products,
        BigDecimal unitPrice,
        BigDecimal quantity,
        BigDecimal subtotal,
        String notes
) {}

