package com.gaedet.biocampovet.core.inventory.util;

import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class ProductUnitTypeValidator {

    public static final Map<ProductUnitType, Set<ProductUnitType>> ALLOWED_VARIANTS = Map.ofEntries(
            // MASA
            Map.entry(ProductUnitType.KILOGRAM, Set.of(
                    ProductUnitType.KILOGRAM,
                    ProductUnitType.GRAM,
                    ProductUnitType.PACK,
                    ProductUnitType.BOX
            )),
            Map.entry(ProductUnitType.GRAM, Set.of(
                    ProductUnitType.GRAM,
                    ProductUnitType.MILLIGRAM,
                    ProductUnitType.PACK,
                    ProductUnitType.BOX
            )),
            Map.entry(ProductUnitType.MILLIGRAM, Set.of(
                    ProductUnitType.MICROGRAM,
                    ProductUnitType.BOX,
                    ProductUnitType.PACK
            )),
            Map.entry(ProductUnitType.MICROGRAM, Set.of(
                    ProductUnitType.BOX,
                    ProductUnitType.PACK
            )),

            // LÍQUIDOS
            Map.entry(ProductUnitType.LITER, Set.of(
                    ProductUnitType.LITER,
                    ProductUnitType.MILLILITER,
                    ProductUnitType.PACK,
                    ProductUnitType.BOX
            )),
            Map.entry(ProductUnitType.MILLILITER, Set.of(
                    ProductUnitType.MILLILITER,
                    ProductUnitType.PACK,
                    ProductUnitType.BOX
            )),

            // UNITARIOS
            Map.entry(ProductUnitType.UNIT, Set.of(
                    ProductUnitType.PACK,
                    ProductUnitType.BOX
            )),

            // FORMAS FARMACÉUTICAS SÓLIDAS
            Map.entry(ProductUnitType.CAPSULE, Set.of(
                    ProductUnitType.PACK,
                    ProductUnitType.BOX
            )),
            Map.entry(ProductUnitType.TABLET, Set.of(
                    ProductUnitType.PACK,
                    ProductUnitType.BOX
            )),

            // CONJUNTOS
            Map.entry(ProductUnitType.PACK, Set.of(
                    ProductUnitType.BOX,
                    ProductUnitType.UNIT
            )),
            Map.entry(ProductUnitType.BOX, Set.of(
                    ProductUnitType.PACK,
                    ProductUnitType.UNIT
            ))
    );

    static final Map<ProductUnitType, Map<ProductUnitType, Double>> UNIT_CONVERSION_FACTORS = Map.of(
            ProductUnitType.KILOGRAM, Map.of(ProductUnitType.GRAM, 1000.0),
            ProductUnitType.GRAM, Map.of( ProductUnitType.MILLIGRAM, 1000.0),
            ProductUnitType.MILLIGRAM, Map.of(ProductUnitType.MICROGRAM, 1000.0),
            ProductUnitType.LITER, Map.of(ProductUnitType.MILLILITER, 1000.0)
    );

    public static boolean isCompatible(ProductUnitType original, ProductUnitType variant) {
        System.out.println("Validando compatibilidad entre: " + original + " y " + variant);
        return ALLOWED_VARIANTS.getOrDefault(original, Set.of()).contains(variant);
    }

    public static boolean isValidContentTotal(ProductUnitType unitType, Double contentTotal) {
        if (unitType == ProductUnitType.UNIT) {
            return contentTotal != null && contentTotal == 1.0;
        }
        return true;
    }

    public static Set<ProductUnitType> getAllowedVariants(ProductUnitType unitType) {
        return ALLOWED_VARIANTS.getOrDefault(unitType, Set.of());
    }

    public static Set<ProductUnitType> getAllowedVariantsFiltered(ProductUnitType unitType) {
        return getAllowedVariants(unitType)
                .stream()
                .filter(v -> !v.equals(unitType))
                .collect(Collectors.toSet());
    }

    public static boolean isValidQuantityConversion(
            ProductUnitType originalUnit,
            ProductUnitType variantUnit,
            double originalQuantity,
            double variantQuantity
    ) {
        if (originalUnit == variantUnit) {
            return variantQuantity <= originalQuantity;
        }

        Map<ProductUnitType, Double> variants = UNIT_CONVERSION_FACTORS.get(originalUnit);

        if (variants == null || !variants.containsKey(variantUnit)) {
            return true;
        }

        double factor = variants.get(variantUnit);
        double convertedOriginal = originalQuantity * factor;

        return variantQuantity <= convertedOriginal;
    }

    public static double calculateEffectiveQuantity(Product product, ProductUnitType incomingUnit, double quantity) {
        ProductUnitType baseUnit = product.getUnitType();

        if (baseUnit == incomingUnit) {
            return quantity;
        }

        Map<ProductUnitType, Double> conversionMap = ProductUnitTypeValidator.UNIT_CONVERSION_FACTORS.get(baseUnit);

        if (conversionMap == null || !conversionMap.containsKey(incomingUnit)) {
            throw new IllegalArgumentException("No se puede convertir de " + incomingUnit + " a " + baseUnit);
        }

        double factor = conversionMap.get(incomingUnit);
        return quantity / factor;
    }

}
