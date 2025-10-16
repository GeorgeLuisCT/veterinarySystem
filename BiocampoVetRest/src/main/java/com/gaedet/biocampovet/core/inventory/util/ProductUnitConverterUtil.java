package com.gaedet.biocampovet.core.inventory.util;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;

import java.util.Map;

import static com.gaedet.biocampovet.core.inventory.util.ProductUnitTypeValidator.UNIT_CONVERSION_FACTORS;


public class ProductUnitConverterUtil {

    public static String formatStock(ProductUnitType baseUnit, int stockUnits, double stockFractional) {
        StringBuilder sb = new StringBuilder();

        if (stockUnits > 0) {
            sb.append(stockUnits).append(" ").append(baseUnit.getLabel()).append("(s)");
        }

        Map<ProductUnitType, Double> fractionalMap = UNIT_CONVERSION_FACTORS.get(baseUnit);
        if (fractionalMap != null && !fractionalMap.isEmpty()) {
            ProductUnitType fractionalUnit = fractionalMap.keySet().iterator().next();
            if (stockFractional > 0) {
                if (!sb.isEmpty()) sb.append(" con ");
                sb.append(stockFractional).append(" ").append(fractionalUnit.getLabel()).append("(s)");
            }
        }

        if (sb.isEmpty()) {
            sb.append("Sin stock");
        }

        return sb.toString();
    }
}
