import React, { createContext, useContext, useState } from "react";
import { CustomerSummaryResponse } from "../types/customer-summary-response";
import { PaginatedResponse } from "@/types/paginated-response";

interface CustomerContextType {
  customers: PaginatedResponse<CustomerSummaryResponse>;
  setCustomers: React.Dispatch<React.SetStateAction<PaginatedResponse<CustomerSummaryResponse>>>;
  addCustomer: (customer: CustomerSummaryResponse) => void;
  removeCustomer: (id: number) => void;
  updateCustomer: (customer: CustomerSummaryResponse) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomerContext debe usarse dentro de CustomerProvider");
  return context;
};

export const CustomerProvider = ({ children }: { children: React.ReactNode }) => {
  const [customers, setCustomers] = useState<PaginatedResponse<CustomerSummaryResponse>>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    pageSize: 0,
    currentPage: 0,
  });

  const addCustomer = (customer: CustomerSummaryResponse) => {
    setCustomers(prev => ({
      ...prev,
      content: [customer, ...prev.content],
    }));
  };

  const removeCustomer = (id: number) => {
    setCustomers(prev => ({
      ...prev,
      content: prev.content.filter(c => c.id !== id),
    }));
  };

  const updateCustomer = (updated: CustomerSummaryResponse) => {
    setCustomers(prev => ({
      ...prev,
      content: prev.content.map(c => (c.id === updated.id ? updated : c)),
    }));
  };

  return (
    <CustomerContext.Provider
      value={{ customers, setCustomers, addCustomer, removeCustomer, updateCustomer }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
