import { getProductPresentationTypeLabel, ProductPresentationType } from "../_enums/product-presentation-type";
import { getProductUnitTypeLabelByQuantity, ProductUnitType } from "../_enums/product-unit-type";
import { presentationToUnitMap } from "./product-mapper";

export type PresentableProduct = {
  presentation: ProductPresentationType;
  unitType: ProductUnitType;
  contentTotal?: number | null;
};

export function formatPresentation(p: PresentableProduct): string {
  const presentationLabel = getProductPresentationTypeLabel(p.presentation);

  if (!p.contentTotal || p.contentTotal === 0) {
    return presentationLabel;
  }

  const mainUnit = presentationToUnitMap[p.presentation] ?? ProductUnitType.UNIT;
  const isLockedUnit = mainUnit === ProductUnitType.UNIT && p.unitType === ProductUnitType.UNIT;

  if (isLockedUnit && p.contentTotal === 1) {
    return `${p.contentTotal} ${presentationLabel}`;
  }

  const unitLabel = getProductUnitTypeLabelByQuantity(p.unitType, p.contentTotal);
  return `${presentationLabel} de ${p.contentTotal} ${unitLabel}`;
}
