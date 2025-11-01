import {
    ProductPresentationType,
    getProductPresentationTypeLabelByQuantity,
} from "../_enums/product-presentation-type";
import {
    ProductUnitType,
    getProductUnitTypeLabel,
    getProductUnitTypeLabelByQuantity
} from "../_enums/product-unit-type";
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

    const isModeFraccionable = isFracionableUnit(modeUnit);
    if (isModeFraccionable) {
        const unitLabel = getProductUnitTypeLabelByQuantity(modeUnit, quantity).toLowerCase();
        return `${qtyText} ${unitLabel}`;
    }

    let finalUnitLabel: string;
    if (presentationType) {
        finalUnitLabel = getProductPresentationTypeLabelByQuantity(presentationType, quantity).toLowerCase();
    } else {
        finalUnitLabel = (quantity === 1) ? "unidad" : "unidades";
    }

    if (modeUnit === ProductUnitType.UNIT) {
        return `${qtyText} ${finalUnitLabel}`;
    }
    const modeLabel = getProductUnitTypeLabel(modeUnit).toLowerCase();
    return `${modeLabel} de ${qtyText} ${finalUnitLabel}`;
}

export function getPurchaseSummaryText(
    formQuantity: number | null | undefined,
    modeUnit: ProductUnitType | null | undefined,
    relativeQuantity: number | null | undefined,
    presentationType: ProductPresentationType | null | undefined
): string {

    if (!modeUnit) {
        return "Seleccione unidad";
    }

    const fQty: number = Number(formQuantity ?? 0);
    const fQtyText = fQty % 1 !== 0 ? fQty.toFixed(2) : String(fQty);

    const rQty: number = Number(relativeQuantity ?? 0);
    const rQtyText = rQty % 1 !== 0 ? rQty.toFixed(2) : String(rQty);

    const isModeFraccionable = isFracionableUnit(modeUnit);
    if (isModeFraccionable) {
        const unitLabel = getProductUnitTypeLabelByQuantity(modeUnit, fQty).toLowerCase();
        return `${fQtyText} ${unitLabel}`;
    }

    if (modeUnit === ProductUnitType.UNIT) {
        let unitLabel: string;
        if (presentationType) {
            unitLabel = getProductPresentationTypeLabelByQuantity(presentationType, fQty).toLowerCase();
        } else {
            unitLabel = (fQty === 1) ? "unidad" : "unidades";
        }
        return `${fQtyText} ${unitLabel}`;
    }
    const modeLabel = getProductUnitTypeLabelByQuantity(modeUnit, fQty).toLowerCase();
    let presentationLabel: string;
    if (presentationType) {
        presentationLabel = getProductPresentationTypeLabelByQuantity(presentationType, rQty).toLowerCase();
    } else {
        presentationLabel = (rQty === 1) ? "unidad" : "unidades";
    }

    return `${fQtyText} ${modeLabel} de ${rQtyText} ${presentationLabel}`;
}