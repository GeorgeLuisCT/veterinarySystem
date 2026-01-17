package com.gaedet.veterinarysystem.core.sales.dto;

import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import com.gaedet.veterinarysystem.core.sales.entity.SaleDetail;

import java.math.BigDecimal;

public record PendingProductMovement(
        SaleDetail detail,
        Long productId,
        Long branchId,
        Long batchId,
        BigDecimal quantity,
        ProductUnitType unitType
) {}