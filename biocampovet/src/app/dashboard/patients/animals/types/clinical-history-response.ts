import { SaleVetServicesGrouped } from "@/app/dashboard/sales/types/sale-vet-services-grouped";
import { AnimalResponse } from "./animal-response";
import { SaleVetProceduresGrouped } from "@/app/dashboard/sales/types/sale-vet-procedures-grouped";
import { SaleProductsGrouped } from "@/app/dashboard/sales/types/sale-products-grouped";
import { ConsultationsGrouped } from "@/app/dashboard/clinic/consultation/types/consultations-grouped";

export interface ClinicalHistoryResponse {
  animal: AnimalResponse;
  saleVetServicesGrouped: SaleVetServicesGrouped;
  saleVetProceduresGrouped: SaleVetProceduresGrouped;
  saleProductsGrouped: SaleProductsGrouped;
  consultationsGrouped: ConsultationsGrouped;
}
