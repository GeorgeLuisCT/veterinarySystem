import { ProductUnitType } from "../enums/product-unit-type";

export interface ProductSaleModeResponse {
  id: number;
  unitType: ProductUnitType;
  price: number;
  quantityEquivalent: number;
}
