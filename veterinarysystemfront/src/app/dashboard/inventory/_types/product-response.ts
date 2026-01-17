import { ProductPresentationType } from "../_enums/product-presentation-type";
import { ProductUnitType } from "../_enums/product-unit-type";
import { AdministrationRoute } from "../_enums/administration-route";
import { CategoryProductResponse } from "./category-product-response";


export interface ProductListParams {
  page?: number;
  size?: number;
  q?: string;
  categoryId?: number;
  branchId?: number;
  active?: boolean;
  presentation?: ProductPresentationType;
  unitType?: ProductUnitType;
  route?: AdministrationRoute;
  hasSaleModes?: boolean;
  availableOnly?: boolean;
  minStockAlertOnly?: boolean;
}

export interface SaleModeSummary {
  id: number;
  unitType: ProductUnitType;
  relativeQuantity: number;
  price: number;
  baseMode: boolean;
}

export interface ProductBasicResponse {
  id: number;
  name: string;
  sku: string;
  unitType: ProductUnitType;
  presentation: ProductPresentationType;
}

export interface BranchStockSummary {
  branchId: number;
  branchName: string;
  active: boolean;
  stockMainUnit: number;
  stockBaseUnitRemainder: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  categoryResponse: CategoryProductResponse;
  description: string | null;
  minStock: number | null;
  sku: string;
  presentation: ProductPresentationType;
  unitType: ProductUnitType;
  contentTotal: number | null;
  standardPrice: number;
  administrationRoutes: AdministrationRoute[];
  saleModes: SaleModeSummary[];
  branchStocks: BranchStockSummary[];
  stockMainUnit: number;
  stockBaseUnitRemainder: number;
  isBelowMinStock: boolean;
  isAvailable: boolean;
}

export interface ProductSummaryResponse {
  id: number;
  name: string;
  categoryName: string | null;
  description: string | null;
  minStock: number | null;
  sku: string;
  presentation: ProductPresentationType;
  unitType: ProductUnitType;
  contentTotal: number | null;
  standardPrice: number;

  administrationRoutes: AdministrationRoute[];
  saleModes: SaleModeSummary[];
  branchStocks: BranchStockSummary[];

  stockMainUnit: number;
  stockBaseUnitRemainder: number;
  isBelowMinStock: boolean;
  isAvailable: boolean;
}

export interface ProductQuickSearchResponse {
  id: number;
  name: string;
  presentation: ProductPresentationType;
  sku: string;
  standardPrice: number;
  unitType: ProductUnitType;
  contentTotal: number;
}