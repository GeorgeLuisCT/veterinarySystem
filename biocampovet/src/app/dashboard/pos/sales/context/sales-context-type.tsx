"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SaleProductLocal } from "../types/sale-product-request";
import { CustomerQuickSearchResponse } from "@/app/dashboard/customer/management/types/customer-quick-search-response";
import { AnimalQuickSearchResponse } from "@/app/dashboard/patients/animals/types/animal-quick-search-response";
import { SalePaymentItem } from "../types/sale-payment-request";
import { SaleStatus } from "../enums/sale-status";

export interface SaleState {
  customer?: CustomerQuickSearchResponse;
  animals: AnimalQuickSearchResponse[];
  saleProducts: SaleProductLocal[];
  status?: string;
  payments?: SalePaymentItem[];
}

interface SalesContextType {
  activeSaleId: string;
  sales: Record<string, SaleState>;
  isLoaded: boolean;
  setActiveSaleId: (id: string) => void;
  addNewSale: (id: string) => void;
  removeSale: (id: string) => string;
  addSaleProduct: (product: SaleProductLocal) => void;
  updateSaleProduct: (updatedProduct: SaleProductLocal) => void;
  removeSaleProduct: (uid: string) => void;
  updateSaleState: (data: Partial<SaleState>) => void;
  resetSale: () => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function useSales() {
  const context = useContext(SalesContext);
  if (!context) throw new Error("useSales debe ser usado dentro de un SalesProvider");
  return context;
}

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = useState<Record<string, SaleState>>({});
  const [activeSaleId, setActiveSaleId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar desde localStorage al iniciar
  useEffect(() => {
    const storedSales = localStorage.getItem("sales");
    const storedActiveSaleId = localStorage.getItem("activeSaleId");

    if (storedSales) {
      const parsedSales = JSON.parse(storedSales);
      setSales(parsedSales);

      if (storedActiveSaleId && parsedSales[storedActiveSaleId]) {
        setActiveSaleId(storedActiveSaleId);
      } else {
        const firstId = Object.keys(parsedSales)[0];
        if (firstId) setActiveSaleId(firstId);
      }
    } else {
      const defaultId = "venta-1";
      const defaultSales = {
        [defaultId]: {
          customer: undefined,
          animals: [],
          saleProducts: [],
          status: SaleStatus.PENDING,
          payments: [],
        },
      };
      setSales(defaultSales);
      setActiveSaleId(defaultId);

      localStorage.setItem("sales", JSON.stringify(defaultSales));
      localStorage.setItem("activeSaleId", defaultId);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sales", JSON.stringify(sales));
    }
  }, [sales, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("activeSaleId", activeSaleId);
    }
  }, [activeSaleId, isLoaded]);

  const addNewSale = (id: string) => {
    setSales((prev) => ({
      ...prev,
      [id]: {
        customer: undefined,
        animals: [],
        saleProducts: [],
        status: SaleStatus.PENDING,
        payments: [],
      },
    }));
    setActiveSaleId(id);
  };

  const removeSale = (id: string): string => {
    const updatedSales = { ...sales };
    delete updatedSales[id];

    let newActiveId = Object.keys(updatedSales)[0];

    // Si no queda ninguna venta, crear una nueva
    if (!newActiveId) {
      newActiveId = `venta-${Date.now()}`;
      updatedSales[newActiveId] = {
        customer: undefined,
        animals: [],
        saleProducts: [],
        status: SaleStatus.PENDING,
        payments: [],
      };
    }

    setSales(updatedSales);
    setActiveSaleId(newActiveId);
    localStorage.setItem("sales", JSON.stringify(updatedSales));
    localStorage.setItem("activeSaleId", newActiveId);

    return newActiveId;
  };

  const updateSaleState = (data: Partial<SaleState>) => {
    setSales((prev) => ({
      ...prev,
      [activeSaleId]: {
        ...prev[activeSaleId],
        ...data,
      },
    }));
  };

  const resetSale = () => {
    setSales((prev) => ({
      ...prev,
      [activeSaleId]: {
        customer: undefined,
        animals: [],
        saleProducts: [],
        status: SaleStatus.PENDING,
        payments: [],
      },
    }));
  };

  const addSaleProduct = (product: SaleProductLocal) => {
    setSales((prev) => ({
      ...prev,
      [activeSaleId]: {
        ...prev[activeSaleId],
        saleProducts: [...(prev[activeSaleId]?.saleProducts ?? []), product],
      },
    }));
  };

  const updateSaleProduct = (updatedProduct: SaleProductLocal) => {
    setSales((prev) => ({
      ...prev,
      [activeSaleId]: {
        ...prev[activeSaleId],
        saleProducts:
          prev[activeSaleId]?.saleProducts.map((p) =>
            p.uid === updatedProduct.uid ? updatedProduct : p
          ) ?? [],
      },
    }));
  };

  const removeSaleProduct = (uid: string) => {
    setSales((prev) => ({
      ...prev,
      [activeSaleId]: {
        ...prev[activeSaleId],
        saleProducts: prev[activeSaleId]?.saleProducts.filter((p) => p.uid !== uid) ?? [],
      },
    }));
  };



  return (
    <SalesContext.Provider
      value={{
        activeSaleId,
        sales,
        isLoaded,
        setActiveSaleId,
        addNewSale,
        removeSale,
        addSaleProduct,
        updateSaleProduct,
        removeSaleProduct,
        updateSaleState,
        resetSale,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}
