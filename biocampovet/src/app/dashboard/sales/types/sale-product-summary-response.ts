import { ProductUnitType } from "../../inventory/products/enums/product-unit-type";

export interface SaleProductSummaryResponse {
    id: number;
    productId: number;
    productName: string;
    unitType: ProductUnitType;
    quantityEquivalent: number;
    price: string;
    discount: string;
    subtotal: string;
    applied: boolean;
  }
  