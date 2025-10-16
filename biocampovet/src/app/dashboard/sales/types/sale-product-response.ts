import { AnimalResponse } from "@/app/dashboard/patients/animals/types/animal-response";
import { ProductResponse } from "../../inventory/products/types/product-response";
import { ProductUnitType } from "../../inventory/products/enums/product-unit-type";

export interface SaleProductResponse {
    id: number;
    product: ProductResponse;
    unitType: ProductUnitType;
    quantityEquivalent: number;
    price: number;
    discount?: number;
    subtotal: number;
    animal?: AnimalResponse;
    applied: boolean;
  }