export interface SaleSummaryLine {
    saleId: number;
    itemDescription: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    soldAt: string;
    document: string;
}
