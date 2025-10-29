import { ProductUnitType } from "../_enums/product-unit-type";
import { ProductPresentationType } from "../_enums/product-presentation-type";
import { ProductApiCreateRequest, ProductApiUpdateRequest, ProductRequest } from "../_types/product-request";

export const presentationToUnitMap: Record<ProductPresentationType, ProductUnitType> = {
  [ProductPresentationType.BOTTLE]: ProductUnitType.UNIT,
  [ProductPresentationType.BAG]: ProductUnitType.PACK,
  [ProductPresentationType.BOX]: ProductUnitType.BOX,
  [ProductPresentationType.JAR]: ProductUnitType.UNIT,
  [ProductPresentationType.SACHET]: ProductUnitType.PACK,
  [ProductPresentationType.BLISTER]: ProductUnitType.PACK,
  [ProductPresentationType.CAN]: ProductUnitType.UNIT,
  [ProductPresentationType.TUBE]: ProductUnitType.UNIT,
  [ProductPresentationType.PACK]: ProductUnitType.PACK,
  [ProductPresentationType.AMPOULE]: ProductUnitType.UNIT,
  [ProductPresentationType.SYRINGE]: ProductUnitType.UNIT,
  [ProductPresentationType.GALLON]: ProductUnitType.UNIT,
  [ProductPresentationType.CASE]: ProductUnitType.BOX,
  [ProductPresentationType.ROLL]: ProductUnitType.UNIT,
  [ProductPresentationType.LOOSE]: ProductUnitType.UNIT,
  [ProductPresentationType.NONE]: ProductUnitType.UNIT,
};

export function mapToCreateRequest(data: ProductRequest): ProductApiCreateRequest {
  const mainUnitType = presentationToUnitMap[data.presentation] ?? ProductUnitType.UNIT;

  return {
    ...data,
    baseUnitType: data.unitType,
    mainUnitType: mainUnitType,
    branchIds: data.branchIds ?? [],
  };
}

export function mapToUpdateRequest(data: ProductRequest, id: number): ProductApiUpdateRequest {
  const mainUnitType = presentationToUnitMap[data.presentation] ?? ProductUnitType.UNIT;

  return {
    ...data,
    id: id,
    baseUnitType: data.unitType,
    mainUnitType: mainUnitType,
  };
}