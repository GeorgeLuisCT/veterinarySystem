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
                ((Number) row[0]).longValue(),    // id
                (String) row[1],                  // name
                (String) row[2],                  //presentation
                (String) row[3],                  // sku
                (BigDecimal) row[4]               // standard_price
        );
    }
}

