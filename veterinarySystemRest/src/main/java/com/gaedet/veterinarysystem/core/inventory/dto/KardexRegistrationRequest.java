package com.gaedet.veterinarysystem.core.inventory.dto;

import com.gaedet.veterinarysystem.core.inventory.enums.KardexMovementType;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class KardexRegistrationRequest {
    private Long productId;
    private Long branchId;
    private Long batchId;
    private BigDecimal quantity;
    private ProductUnitType unitType;
    private KardexMovementType type;
    private Long originId;
    private String originType;
}