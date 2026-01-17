import { ProductUnitType } from "../_enums/product-unit-type";

export interface ProductSaleModeResponse {
  id: number;
  unitType: ProductUnitType;
  price: number;
  quantityEquivalent: number;
}
