import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { CustomerResponse } from "@/app/dashboard/customer/management/types/customer-response";
import { EmployeeResponse } from "@/app/dashboard/staff/employees/types/employee-response";
import { SaleProductResponse } from "./sale-product-response";
import { SalePaymentResponse } from "./sale-payment-response";
import { SaleStatus } from "../enums/sale-status";

export interface SaleResponse {
  id: number;
  branch: BranchResponse;
  employee: EmployeeResponse;
  customer?: CustomerResponse;
  saleDate: string;
  saleProducts: SaleProductResponse[];
  salePayments: SalePaymentResponse[];
  status: SaleStatus;
}
