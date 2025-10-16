package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.inventory.util.ProductUnitConverterUtil;

import java.math.BigDecimal;

public record ProductSummaryResponse(
        Long id,
        String name,
        String sku,
        String categoryName,
        BigDecimal standardPrice,
        String formattedStock,
        String branchNames
) {
    public static ProductSummaryResponse fromNativeRow(Object[] row) {
        ProductUnitType unitType = ProductUnitType.valueOf((String) row[4]);
        int stockUnits = ((Number) row[6]).intValue();
        double stockFractional = ((Number) row[7]).doubleValue();

        String formattedStock = ProductUnitConverterUtil.formatStock(unitType, stockUnits, stockFractional);

        return new ProductSummaryResponse(
                ((Number) row[0]).longValue(),       // id
                (String) row[1],                     // name
                (String) row[2],                     // sku
                (String) row[3],                     // category name
                new BigDecimal(row[5].toString()),   // standardPrice
                formattedStock,                      // formattedStock
                (String) row[9]                      // branchNames
        );
    }
}

