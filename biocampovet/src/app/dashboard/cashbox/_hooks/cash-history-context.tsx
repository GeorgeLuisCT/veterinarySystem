"use client";

import { PaginatedResponse } from "@/types/paginated-response";
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { CashSessionHistoryResponse } from "../_types/cash-session-response";

type PaginatedHistory = PaginatedResponse<CashSessionHistoryResponse>;

interface CashHistoryContextType {
  history: PaginatedHistory;
  setHistory: Dispatch<SetStateAction<PaginatedHistory>>;
}

const defaultPaginatedResponse: PaginatedHistory = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  pageSize: 10,
};

const CashHistoryContext = createContext<CashHistoryContextType | undefined>(undefined);

export function CashSessionHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<PaginatedHistory>(defaultPaginatedResponse);

  return (
    <CashHistoryContext.Provider value={{ history, setHistory }}>
      {children}
    </CashHistoryContext.Provider>
  );
}

export function useCashHistoryContext() {
  const context = useContext(CashHistoryContext);
  if (context === undefined) {
    throw new Error("useCashHistoryContext must be used within a CashSessionHistoryProvider");
  }
  return context;
}