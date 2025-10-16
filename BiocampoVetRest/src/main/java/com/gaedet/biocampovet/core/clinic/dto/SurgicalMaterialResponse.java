package com.gaedet.biocampovet.core.clinic.dto;

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
}
