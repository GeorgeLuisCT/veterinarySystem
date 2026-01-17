package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.FrequencyUnit;
import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PostOperativeIndicationResponse {

    private final Long id;
    private final Long productId;
    private final String productName;
    private final String nonDrugInstruction;
    private final BigDecimal doseAmount;
    private final ProductUnitType doseUnit;
    private final Integer frequencyValue;
    private final FrequencyUnit frequencyUnit;
    private final AdministrationRoute route;
}
