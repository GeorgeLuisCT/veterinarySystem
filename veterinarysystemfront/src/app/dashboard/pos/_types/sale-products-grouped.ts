import { SaleSummaryLine } from "./sale-summary-line";

export interface SaleProductsGrouped {
    categories: Record<string, SaleSummaryLine[]>;
}
