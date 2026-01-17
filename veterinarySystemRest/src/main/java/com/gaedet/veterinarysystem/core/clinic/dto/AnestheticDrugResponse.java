package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.AnestheticPhase;
import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class AnestheticDrugResponse {

    private final Long id;
    private final Long productId;
    private final String productName;
    private final AnestheticPhase phase;
    private final BigDecimal doseAmount;
    private final ProductUnitType doseUnit;
    private final AdministrationRoute route;
}
