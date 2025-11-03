import { SaleStatus } from "../enums/sale-status";

export interface SaleSummaryResponse {
  id: number;
  employeeFullName: string;
  customerName: string | null;
  saleDate: string;
  totalProducts: number;
  totalServices: number;
  totalProcedures: number;
  totalAmount: number;
  totalPaid: number;
  status: SaleStatus;
}
