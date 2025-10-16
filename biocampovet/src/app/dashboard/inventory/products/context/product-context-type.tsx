import React, { createContext, useContext, useState } from "react";
import { ProductSummaryResponse } from "../types/product-summary-response";
import { PaginatedResponse } from "@/types/paginated-response";

interface ProductContextType {
  products: PaginatedResponse<ProductSummaryResponse>;
  setProducts: React.Dispatch<React.SetStateAction<PaginatedResponse<ProductSummaryResponse>>>;
  addProduct: (product: ProductSummaryResponse) => void;
  removeProduct: (id: number) => void;
  updateProduct: (product: ProductSummaryResponse) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProductContext debe usarse dentro de ProductProvider");
  return context;
};

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<PaginatedResponse<ProductSummaryResponse>>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    pageSize: 0,
    currentPage: 0,
  });

  const addProduct = (product: ProductSummaryResponse) => {
    setProducts(prev => ({
      ...prev,
      content: [product, ...prev.content],
    }));
  };

  const removeProduct = (id: number) => {
    setProducts(prev => ({
      ...prev,
      content: prev.content.filter(p => p.id !== id),
    }));
  };

  const updateProduct = (updated: ProductSummaryResponse) => {
    setProducts(prev => ({
      ...prev,
      content: prev.content.map(p => (p.id === updated.id ? updated : p)),
    }));
  };

  return (
    <ProductContext.Provider
      value={{ products, setProducts, addProduct, removeProduct, updateProduct }}
    >
      {children}
    </ProductContext.Provider>
  );
};
