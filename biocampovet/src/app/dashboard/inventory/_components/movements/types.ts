import { ProductUnitType } from "../../_enums/product-unit-type";
import { AdjustmentType } from "../../_enums/adjustment-type";

export interface PurchaseProductDraft {
  productId: number;
  productName: string;
  sku?: string | null;
  batchNumber: string;
  expirationDate?: string;
  quantity: number;
  unitType: ProductUnitType;
  unitCost: number;
}

export interface TransferProductDraft {
  productId: number;
  productName: string;
  sku?: string | null;
  batchId: number;
  quantity: number;
  unitType: ProductUnitType;
}

export interface AdjustmentProductDraft {
  productId: number;
  productName: string;
  sku?: string | null;
  batchId: number;
  quantity: number;
  unitType: ProductUnitType;
  adjustmentType: AdjustmentType;
  reason?: string;
}
