package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class GroomingMaterialResponse {
    private final Long id;
    private final Long productId;
    private final String productName;
    private final String unregisteredProductName;
    private final BigDecimal quantity;
    private final ProductUnitType unitType;
    private final BigDecimal unitPrice;
    private final BigDecimal subtotal;
}
