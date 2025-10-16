import { SaleProductSummaryResponse } from "./sale-product-summary-response";

export interface SaleProductsGrouped {
  categories: Record<string, SaleProductSummaryResponse[]>;
}
