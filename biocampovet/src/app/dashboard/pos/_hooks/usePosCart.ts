"use client";

import { useCallback, useMemo, useState } from "react";
import { ProductQuickSearchResponse, SaleModeSummary } from "@/app/dashboard/inventory/_types/product-response";
import { BillableServiceItem } from "../_types/billable-service";
import { SaleItemKind } from "../_types/sale-enums";
import { SaleItemRequest } from "../_types/sale-request";

export interface PosCartItem extends SaleItemRequest {
  id: string;
  name: string;
  lineSubtotal: number;
  saleModeLabel?: string;
  quantityEquivalent?: number;
}

const generateId = () => Math.random().toString(36).slice(2, 11);

export function usePosCart(initialItems: PosCartItem[] = []) {
  const [items, setItems] = useState<PosCartItem[]>(initialItems);

  const addProduct = useCallback((product: ProductQuickSearchResponse, saleMode: SaleModeSummary) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.kind === SaleItemKind.PRODUCT &&
          item.productId === product.id &&
          item.saleModeId === saleMode.id
      );
      if (existing) {
        const updatedQuantity = existing.quantity + 1;
        return prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: updatedQuantity, lineSubtotal: updatedQuantity * item.unitPrice }
            : item
        );
      }
      const price = saleMode.price ?? 0;
      const newItem: PosCartItem = {
        id: generateId(),
        kind: SaleItemKind.PRODUCT,
        productId: product.id,
        saleModeId: saleMode.id,
        unitPrice: price,
        quantity: 1,
        unitType: saleMode.unitType,
        name: `${product.name} - ${saleMode.unitType}`,
        saleModeLabel: saleMode.unitType,
        quantityEquivalent: saleMode.relativeQuantity ?? undefined,
        lineSubtotal: price,
      };
      return [...prev, newItem];
    });
  }, []);

  const addService = useCallback((service: BillableServiceItem) => {
    setItems((prev) => {
      const newItem: PosCartItem = {
        id: generateId(),
        kind: SaleItemKind.SERVICE,
        serviceType: service.type,
        serviceItemId: service.itemId,
        unitPrice: service.unitPrice,
        quantity: service.quantity,
        taxRate: service.taxRate,
        metadataJson: service.metadataJson,
        name: service.description,
        lineSubtotal: service.unitPrice * service.quantity,
      };
      return [...prev, newItem];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity, lineSubtotal: quantity * item.unitPrice }
          : item
      )
    );
  }, []);

  const updateUnitPrice = useCallback((itemId: string, unitPrice: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, unitPrice, lineSubtotal: unitPrice * item.quantity }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const resetCart = useCallback(() => {
    setItems([]);
  }, []);

  const setCartItems = useCallback((nextItems: PosCartItem[]) => {
    setItems(nextItems);
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const taxTotal = items.reduce((acc, item) => acc + (item.taxAmount ?? 0), 0);
    const grandTotal = subtotal + taxTotal;
    return { subtotal, taxTotal, grandTotal };
  }, [items]);

  const toSaleItems = useCallback((): SaleItemRequest[] => {
    return items.map((item) => ({
      kind: item.kind,
      productId: item.productId,
      productBatchId: item.productBatchId,
      saleModeId: item.saleModeId,
      serviceType: item.serviceType,
      serviceItemId: item.serviceItemId,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      unitType: item.unitType,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      descriptionOverride: item.name,
      metadataJson: item.metadataJson,
    }));
  }, [items]);

  return {
    items,
    addProduct,
    addService,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    resetCart,
    setCartItems,
    totals,
    toSaleItems,
  };
}
