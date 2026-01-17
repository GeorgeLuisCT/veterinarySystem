import React, { createContext, useContext, useState } from "react";
import { SupplierSummaryResponse } from "../_types/supplier-response";
import { PaginatedResponse } from "@/types/paginated-response";

interface SupplierContextType {
  suppliers: PaginatedResponse<SupplierSummaryResponse>;
  setSuppliers: React.Dispatch<React.SetStateAction<PaginatedResponse<SupplierSummaryResponse>>>;
  addSupplier: (supplier: SupplierSummaryResponse) => void;
  removeSupplier: (id: number) => void;
  updateSupplier: (supplier: SupplierSummaryResponse) => void;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const useSupplierContext = () => {
  const context = useContext(SupplierContext);
  if (!context) throw new Error("useSupplierContext debe usarse dentro de SupplierProvider");
  return context;
};

export const SupplierProvider = ({ children }: { children: React.ReactNode }) => {
  const [suppliers, setSuppliers] = useState<PaginatedResponse<SupplierSummaryResponse>>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    pageSize: 0,
    currentPage: 0,
  });

  const addSupplier = (supplier: SupplierSummaryResponse) => {
    setSuppliers(prev => ({
      ...prev,
      content: [supplier, ...prev.content],
    }));
  };

  const removeSupplier = (id: number) => {
    setSuppliers(prev => ({
      ...prev,
      content: prev.content.filter(s => s.id !== id),
    }));
  };

  const updateSupplier = (updated: SupplierSummaryResponse) => {
    setSuppliers(prev => ({
      ...prev,
      content: prev.content.map(s => (s.id === updated.id ? updated : s)),
    }));
  };

  return (
    <SupplierContext.Provider
      value={{ suppliers, setSuppliers, addSupplier, removeSupplier, updateSupplier }}
    >
      {children}
    </SupplierContext.Provider>
  );
};
