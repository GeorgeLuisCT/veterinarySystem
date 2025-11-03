export interface ProductBatchSummaryResponse {
  id: number;
  batchNumber: string;
  expirationDate?: string | null;
}

export interface ProductBatchSearchResponse {
  id: number;
  batchNumber: string;
  productId: number;
  expirationDate: string | null;
}