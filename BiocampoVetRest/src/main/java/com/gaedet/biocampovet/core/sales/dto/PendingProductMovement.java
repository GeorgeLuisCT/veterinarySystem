package com.gaedet.biocampovet.core.sales.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.sales.entity.SaleDetail;

import java.math.BigDecimal;

public record PendingProductMovement(
        SaleDetail detail,
        Long productId,
        Long branchId,
        Long batchId,
        BigDecimal quantity,
        ProductUnitType unitType
) {}