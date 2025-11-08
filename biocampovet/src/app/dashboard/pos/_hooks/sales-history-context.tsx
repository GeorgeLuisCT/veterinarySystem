"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PaginatedResponse } from "@/types/paginated-response";
import { SaleSummaryResponse } from "../_types/sale-response";

interface SalesContextType {
  sales: PaginatedResponse<SaleSummaryResponse>;
  setSales: (sales: PaginatedResponse<SaleSummaryResponse>) => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

const defaultPagination: PaginatedResponse<SaleSummaryResponse> = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  pageSize: 10,
};

export function SalesHistoryProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<PaginatedResponse<SaleSummaryResponse>>(
    defaultPagination
  );

  return (
    <SalesContext.Provider value={{ sales, setSales }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSalesHistoryContext() {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error("useSalesHistoryContext debe usarse dentro de un SalesHistoryProvider");
  }
  return context;
}