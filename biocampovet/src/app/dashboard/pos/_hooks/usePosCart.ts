// app/dashboard/pos/_hooks/usePosCart.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  ProductQuickSearchResponse,
  SaleModeSummary,
} from "@/app/dashboard/inventory/_types/product-response";
import type { BillableServiceItem } from "../_types/billable-service";
import { SaleItemKind } from "../_types/sale-enums";
import type { SaleItemRequest } from "../_types/sale-request"; // Usamos el tipo Zod inferido
import { formatPresentation } from "../../inventory/_helpers/product-formatters";
import { getSaleModeSummaryText } from "../../inventory/_utils/product-util-labels";

export interface PosCartItem extends SaleItemRequest {
  id: string; // ID local único para React
  detailId?: number; // ID de la base de datos (SaleDetail.id)
  name: string; // Descripción para mostrar en el carrito
  lineSubtotal: number;
  saleModeLabel?: string;
  quantityEquivalent?: number;
}

const generateId = () => Math.random().toString(36).slice(2, 11);

export function usePosCart(initialItems: PosCartItem[] = []) {
  const [items, setItems] = useState<PosCartItem[]>(initialItems);

  const addProduct = useCallback(
    (product: ProductQuickSearchResponse, saleMode: SaleModeSummary) => {
      setItems((prev) => {
        const existing = prev.find(
          (item) =>
            item.kind === SaleItemKind.PRODUCT &&
            item.productId === product.id &&
            item.saleModeId === saleMode.id &&
            !item.detailId // Solo agrupar si es un ítem nuevo (no cargado)
        );

        if (existing) {
          const updatedQuantity = (existing.quantity ?? 0) + 1;
          return prev.map((item) =>
            item.id === existing.id
              ? {
                ...item,
                quantity: updatedQuantity,
                lineSubtotal: updatedQuantity * item.unitPrice,
              }
              : item
          );
        }

        const price = saleMode.price ?? 0;

        const labelForMode = saleMode.baseMode
          ? formatPresentation(product)
          : getSaleModeSummaryText(
            saleMode.unitType,
            saleMode.relativeQuantity,
            product.presentation
          );

        const newItem: PosCartItem = {
          id: generateId(),
          detailId: undefined, // Es un ítem nuevo
          kind: SaleItemKind.PRODUCT,
          productId: product.id,
          saleModeId: saleMode.id,
          unitPrice: price,
          quantity: 1,
          unitType: saleMode.unitType,
          taxRate: undefined,
          taxAmount: undefined,
          descriptionOverride: undefined,
          metadataJson: undefined,
          name: `${product.name}`,
          saleModeLabel: labelForMode,
          quantityEquivalent: saleMode.relativeQuantity ?? undefined,
          lineSubtotal: price,
        };
        return [...prev, newItem];
      });
    },
    []
  );

  const addService = useCallback((service: BillableServiceItem) => {
    setItems((prev) => {
      const qty = service.quantity ?? 1;
      const price = service.unitPrice ?? 0;

      const newItem: PosCartItem = {
        id: generateId(),
        detailId: undefined, // Es un ítem nuevo
        kind: SaleItemKind.SERVICE,
        serviceType: service.type,
        serviceItemId: service.itemId,
        unitPrice: price,
        quantity: qty,
        taxRate: service.taxRate,
        taxAmount: service.quantity,
        metadataJson: service.metadataJson,
        descriptionOverride: undefined,
        name: service.description,
        lineSubtotal: price * qty,
      };
      return [...prev, newItem];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
            ...item,
            quantity,
            lineSubtotal: (item.unitPrice ?? 0) * quantity,
          }
          : item
      )
    );
  }, []);

  const updateUnitPrice = useCallback((itemId: string, unitPrice: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, unitPrice, lineSubtotal: unitPrice * (item.quantity ?? 0) }
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
    const subtotal = items.reduce(
      (acc, item) => acc + (item.unitPrice ?? 0) * (item.quantity ?? 0),
      0
    );
    const taxTotal = items.reduce((acc, item) => acc + (item.taxAmount ?? 0), 0);
    const grandTotal = subtotal + taxTotal;
    return { subtotal, taxTotal, grandTotal };
  }, [items]);

  const toSaleItems = useCallback((): SaleItemRequest[] => {
    return items.map((item) => ({
      kind: item.kind,
      productId: item.productId,
      saleModeId: item.saleModeId,
      serviceType: item.serviceType,
      serviceItemId: item.serviceItemId,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      unitType: item.unitType,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      descriptionOverride: item.descriptionOverride ?? item.name, // Asegurarse de enviar la descripción
      metadataJson: item.metadataJson,
    }));
  }, [items]);

  const findItemByClientId = useCallback(
    (clientId: string) => {
      return items.find((item) => item.id === clientId);
    },
    [items]
  );

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
    findItemByClientId,
  };
}