package com.gaedet.biocampovet.core.inventory.dto;

import java.math.BigDecimal;

public record ProductQuickSearchResponse(
        Long id,
        String name,
        String presentation,
        String sku,
        BigDecimal standardPrice
) {
    public static ProductQuickSearchResponse fromNativeRow(Object[] row) {
        return new ProductQuickSearchResponse(
                ((Number) row[0]).longValue(),
                (String) row[1],
                (String) row[2],
                (String) row[3],
                (BigDecimal) row[4]
        );
    }
}
