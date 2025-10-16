import { ProductBranchStockResponse } from "./product-branch-stock-response";
import { ProductSaleModeResponse } from "./product-sale-mode-response";
import { ProductPresentationType } from "../enums/product-presentation-type";
import { ProductUnitType } from "../enums/product-unit-type";
import { CategoryProductResponse } from "./category-product-response";

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
  branchStocks: ProductBranchStockResponse[];
  saleModes: ProductSaleModeResponse[];
}
