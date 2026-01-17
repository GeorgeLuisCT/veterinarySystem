import { SaleProductsGrouped } from "@/app/dashboard/pos/_types/sale-products-grouped";
import { AnimalResponse } from "./animal-response";

export interface ClinicalHistoryResponse {
  animal: AnimalResponse;
  saleProductsGrouped: SaleProductsGrouped;
}
