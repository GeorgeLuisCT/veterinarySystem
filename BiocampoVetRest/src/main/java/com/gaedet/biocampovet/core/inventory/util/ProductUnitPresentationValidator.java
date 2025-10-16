package com.gaedet.biocampovet.core.inventory.util;

import com.gaedet.biocampovet.core.inventory.enums.ProductPresentationType;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;

import java.util.Map;
import java.util.Set;

public class ProductUnitPresentationValidator {

    private static final Map<ProductPresentationType, Set<ProductUnitType>> ALLOWED_UNITS_BY_PRESENTATION = Map.ofEntries(
            Map.entry(ProductPresentationType.BAG, Set.of(
                    ProductUnitType.KILOGRAM,
                    ProductUnitType.GRAM
            )),
            Map.entry(ProductPresentationType.BOTTLE, Set.of(
                    ProductUnitType.LITER,
                    ProductUnitType.MILLILITER
            )),
            Map.entry(ProductPresentationType.BOX, Set.of(
                    ProductUnitType.UNIT,
                    ProductUnitType.CAPSULE,
                    ProductUnitType.TABLET,
                    ProductUnitType.KILOGRAM,
                    ProductUnitType.GRAM
            )),
            Map.entry(ProductPresentationType.BLISTER, Set.of(
                    ProductUnitType.CAPSULE,
                    ProductUnitType.TABLET
            )),
            Map.entry(ProductPresentationType.PACK, Set.of(
                    ProductUnitType.UNIT,
                    ProductUnitType.CAPSULE,
                    ProductUnitType.TABLET
            )),
            Map.entry(ProductPresentationType.CAN, Set.of(
                    ProductUnitType.LITER,
                    ProductUnitType.MILLILITER
            )),
            Map.entry(ProductPresentationType.JAR, Set.of(
                    ProductUnitType.LITER,
                    ProductUnitType.MILLILITER
            )),
            Map.entry(ProductPresentationType.TUBE, Set.of(
                    ProductUnitType.UNIT,
                    ProductUnitType.CAPSULE,
                    ProductUnitType.TABLET
            )),
            Map.entry(ProductPresentationType.SACHET, Set.of(
                    ProductUnitType.GRAM,
                    ProductUnitType.MILLIGRAM
            )),
            Map.entry(ProductPresentationType.AMPOULE, Set.of(
                    ProductUnitType.MILLILITER,
                    ProductUnitType.MICROGRAM
            )),
            Map.entry(ProductPresentationType.SYRINGE, Set.of(
                    ProductUnitType.MILLILITER,
                    ProductUnitType.MICROGRAM
            )),
            Map.entry(ProductPresentationType.GALLON, Set.of(
                    ProductUnitType.LITER
            )),
            Map.entry(ProductPresentationType.CASE, Set.of(
                    ProductUnitType.UNIT,
                    ProductUnitType.CAPSULE,
                    ProductUnitType.TABLET
            )),
            Map.entry(ProductPresentationType.ROLL, Set.of(
                    ProductUnitType.UNIT
            )),
            Map.entry(ProductPresentationType.LOOSE, Set.of(
                    ProductUnitType.UNIT
            )),
            Map.entry(ProductPresentationType.NONE, Set.of(
                    ProductUnitType.UNIT
            ))
    );

    public static boolean isUnitCompatibleWithPresentation(ProductPresentationType presentation, ProductUnitType unit) {
        System.out.println("Validando compatibilidad de unidad " + unit + " con presentación " + presentation);
        return ALLOWED_UNITS_BY_PRESENTATION.getOrDefault(presentation, Set.of()).contains(unit);
    }
}
