import { ProductPresentationType } from "../enums/product-presentation-type";

export interface ProductQuickSearchResponse {
    id: number;
    name: string;
    presentation: ProductPresentationType;
    sku: string;
    standardPrice: string;
  }
  