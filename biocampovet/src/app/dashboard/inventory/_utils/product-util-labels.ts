import { getProductPresentationTypeLabel, ProductPresentationType } from "../_enums/product-presentation-type";
import { getProductUnitTypeLabel, getProductUnitTypeLabelByQuantity, ProductUnitType } from "../_enums/product-unit-type";
import { isFracionableUnit } from "../_utils/product-unit-type-validator";

export function getSaleModeSummaryText(
    modeUnit: ProductUnitType | null | undefined,
    relativeQuantity: number | null | undefined,
    presentationType: ProductPresentationType | null | undefined
): string {

    if (!modeUnit) {
        return "modo de venta";
    }

    const quantity: number = Number(relativeQuantity ?? 0);
    const qtyText = quantity % 1 !== 0 ? quantity.toFixed(2) : String(quantity);

    const modeLabel = getProductUnitTypeLabel(modeUnit).toLowerCase();
    const isModeFraccionable = isFracionableUnit(modeUnit);
    if (isModeFraccionable) {
        const unitLabel = getProductUnitTypeLabelByQuantity(modeUnit, quantity).toLowerCase();
        return `${qtyText} ${unitLabel}`;
    }

    let finalUnitLabel: string;

    if (presentationType) {
        finalUnitLabel = getProductPresentationTypeLabel(presentationType).toLowerCase();
        if (quantity !== 1 && !finalUnitLabel.endsWith("s")) {
            finalUnitLabel += "s";
        }
    } else {
        finalUnitLabel = "unidades";
    }

    return `${modeLabel} de ${qtyText} ${finalUnitLabel}`;
}