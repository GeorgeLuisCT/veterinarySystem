package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SurgicalMaterialResponse {

    private final Long id;
    private final Long productId;
    private final String productName;
    private final String unregisteredProductName;
    private final Integer quantity;
    private final ProductUnitType unitType;
}
