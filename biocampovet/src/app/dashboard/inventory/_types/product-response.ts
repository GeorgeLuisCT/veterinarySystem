import { ProductBranchStockResponse } from "./product-branch-stock-response";
import { ProductSaleModeResponse } from "./product-sale-mode-response";
import { ProductPresentationType } from "../_enums/product-presentation-type";
import { ProductUnitType } from "../_enums/product-unit-type";
import { CategoryProductResponse } from "./category-product-response";
import { AdministrationRoute } from "../_enums/administration-route";


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
  unitType: ProductUnitType;
  quantityEquivalent: number;
  price: number;
}

export interface BranchStockSummary {
  branchId: number;
  branchName: string;
  active: boolean;
  stockUnits: number;
  stockFractional: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  minStock: number;
  category: CategoryProductResponse;
  sku: string;
  presentation: ProductPresentationType;
  unitType: ProductUnitType;
  standardPrice: number;
  contentTotal: number;
  isActive: boolean;
  administrationRoutes?: AdministrationRoute[];

  branchStocks: ProductBranchStockResponse[];
  saleModes: ProductSaleModeResponse[];
}

export interface ProductSummaryResponse {
  id: number;
  name: string;
  categoryName: string | null;
  description: string;
  minStock: number;
  sku: string;
  presentation: ProductPresentationType;
  unitType: ProductUnitType;
  contentTotal: number;
  standardPrice: number | string;
  administrationRoutes: AdministrationRoute[];
  saleModes: SaleModeSummary[];
  branchStocks: BranchStockSummary[];
  totalStockUnits: number;
  totalStockFractional: number;
  belowMinStock: boolean;
}

export interface ProductQuickSearchResponse {
  id: number;
  name: string;
  presentation: ProductPresentationType;
  sku: string;
  standardPrice: string;
}