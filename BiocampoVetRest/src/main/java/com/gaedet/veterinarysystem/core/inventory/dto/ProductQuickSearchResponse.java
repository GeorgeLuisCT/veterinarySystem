package com.gaedet.veterinarysystem.core.inventory.dto;

import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;

import java.math.BigDecimal;

public record ProductQuickSearchResponse(
        Long id,
        String name,
        String presentation,
        String sku,
        BigDecimal standardPrice,
        ProductUnitType unitType,
        BigDecimal contentTotal
) {
    public static ProductQuickSearchResponse fromNativeRow(Object[] row) {
        String unitTypeStr = row[5] != null ? (String) row[5] : null;

        return new ProductQuickSearchResponse(
                ((Number) row[0]).longValue(),
                (String) row[1],
                (String) row[2],
                (String) row[3],
                row[4] != null ? new BigDecimal(((Number) row[4]).toString()) : null,
                unitTypeStr != null ? ProductUnitType.valueOf(unitTypeStr) : null,
                row[6] != null ? new BigDecimal(((Number) row[6]).toString()) : null
        );
    }
}