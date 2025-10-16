export interface ProductSummaryResponse {
    id: number;
    name: string;
    sku: string;
    categoryName: string;
    standardPrice: string;
    isActive: boolean;
    formattedStock: string;
  }