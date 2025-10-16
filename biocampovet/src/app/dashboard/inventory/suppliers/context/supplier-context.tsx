import React, { createContext, useContext, useState } from "react";
import { SupplierSummaryResponse } from "../types/supplier-summary-response";

interface SupplierContextType {
  suppliers: SupplierSummaryResponse[];
  setSuppliers: React.Dispatch<React.SetStateAction<SupplierSummaryResponse[]>>;
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
  const [suppliers, setSuppliers] = useState<SupplierSummaryResponse[]>([]);

  const addSupplier = (supplier: SupplierSummaryResponse) => {
    setSuppliers(prev => [supplier, ...prev]);
  };

  const removeSupplier = (id: number) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const updateSupplier = (updated: SupplierSummaryResponse) => {
    setSuppliers(prev =>
      prev.map(s => (s.id === updated.id ? updated : s))
    );
  };

  return (
    <SupplierContext.Provider
      value={{ suppliers, setSuppliers, addSupplier, removeSupplier, updateSupplier }}
    >
      {children}
    </SupplierContext.Provider>
  );
};
