package com.gaedet.biocampovet.core.inventory.util;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

public final class UnitConversionUtil {

    private UnitConversionUtil() {}

    private static final Map<ProductUnitType, Map<ProductUnitType, Double>> CONVERSION_FACTORS_TO_BASE = Map.ofEntries(
            Map.entry(ProductUnitType.KILOGRAM, Map.of(
                    ProductUnitType.GRAM, 1000.0,
                    ProductUnitType.MILLIGRAM, 1000000.0,
                    ProductUnitType.MICROGRAM, 1000000000.0
            )),
            Map.entry(ProductUnitType.GRAM, Map.of(
                    ProductUnitType.MILLIGRAM, 1000.0,
                    ProductUnitType.MICROGRAM, 1000000.0,
                    ProductUnitType.KILOGRAM, 0.001
            )),
            Map.entry(ProductUnitType.MILLIGRAM, Map.of(
                    ProductUnitType.MICROGRAM, 1000.0,
                    ProductUnitType.GRAM, 0.001,
                    ProductUnitType.KILOGRAM, 0.000001
            )),
            Map.entry(ProductUnitType.MICROGRAM, Map.of(
                    ProductUnitType.MILLIGRAM, 0.001,
                    ProductUnitType.GRAM, 0.000001,
                    ProductUnitType.KILOGRAM, 0.000000001
            )),
            Map.entry(ProductUnitType.LITER, Map.of(
                    ProductUnitType.MILLILITER, 1000.0
            )),
            Map.entry(ProductUnitType.MILLILITER, Map.of(
                    ProductUnitType.LITER, 0.001
            ))
    );


    public static void populateEquivalentsMap(Map<ProductUnitType, Double> equivalentsMap, ProductUnitType baseUnit) {

        equivalentsMap.put(baseUnit, 1.0);

        Map<ProductUnitType, Double> fromBaseConversions = CONVERSION_FACTORS_TO_BASE.get(baseUnit);
        if (fromBaseConversions != null) {

            fromBaseConversions.forEach((targetUnit, factor) -> {
                equivalentsMap.putIfAbsent(targetUnit, 1.0 / factor);
            });
        }

        CONVERSION_FACTORS_TO_BASE.forEach((fromUnit, conversions) -> {

            if (!equivalentsMap.containsKey(fromUnit)) {

                Double factorToBase = conversions.get(baseUnit);

                if (factorToBase != null) {
                    equivalentsMap.put(fromUnit, factorToBase);
                }
            }
        });
    }

    public static BigDecimal convertFromBase(BigDecimal absoluteQuantityInBase, ProductUnitType baseUnit, ProductUnitType modeUnit) {
        if (baseUnit == modeUnit) {
            return absoluteQuantityInBase;
        }

        Map<ProductUnitType, Double> factors = new HashMap<>();
        populateEquivalentsMap(factors, baseUnit);

        Double factor = factors.get(modeUnit);

        if (factor == null || factor == 0.0) {
            return absoluteQuantityInBase;
        }

        BigDecimal factorBd = BigDecimal.valueOf(factor);
        return absoluteQuantityInBase.divide(factorBd, 6, RoundingMode.HALF_UP);
    }
}