package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TreatmentScheduleProductUsageResponse {
    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal quantity;
    private ProductUnitType unit;
}
