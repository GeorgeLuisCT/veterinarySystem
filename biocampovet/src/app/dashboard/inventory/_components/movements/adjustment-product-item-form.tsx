"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductQuickSearchResponse, ProductResponse } from "../../_types/product-response";
import { ProductUnitType, getProductUnitTypeLabel } from "../../_enums/product-unit-type";
import ProductService from "../../_service/product-service";
import type { AdjustmentProductDraft } from "./types";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { ProductPresentationType } from "../../_enums/product-presentation-type";
import { getMovementSummaryText } from "../../_utils/product-util-labels";
import { AdjustmentType, AdjustmentTypeLabels } from "../../_enums/adjustment-type";

interface AdjustmentProductItemFormProps {
  index: number;
  value: AdjustmentProductDraft | null;
  onChange: (index: number, draft: AdjustmentProductDraft) => void;
  onRemove: (index: number) => void;
  productOptions: ProductQuickSearchResponse[];
  productLoading: boolean;
  searchProduct: (q: string) => void;
  cancelProductSearch: () => void;
  disabled?: boolean;
}

export function AdjustmentProductItemForm({
  index,
  value,
  onChange,
  onRemove,
  productOptions,
  productLoading,
  searchProduct,
  cancelProductSearch,
  disabled,
}: AdjustmentProductItemFormProps) {
  const { toast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<ProductQuickSearchResponse | null>(
    value ? { id: value.productId, name: value.productName ?? "", sku: value.sku } as any : null
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(value ? String(value.productId) : "");
  const [fullProductDetails, setFullProductDetails] = useState<ProductResponse | null>(null);
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);

  const [quantity, setQuantity] = useState<string>(value ? String(value.quantity) : "1");
  const [unitType, setUnitType] = useState<ProductUnitType>(value?.unitType ?? ProductUnitType.UNIT);
  const [batchId, setBatchId] = useState<string>(value?.batchId != null ? String(value.batchId) : "");
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>(value?.adjustmentType ?? AdjustmentType.ENTRY);
  const [reason, setReason] = useState<string>(value?.reason ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const productSelectOptions = useMemo(() => {
    const list = productOptions.map((p) => ({ value: String(p.id), label: p.sku ? `${p.name} *(SKU: ${p.sku})*` : p.name }));
    if (selectedProduct && !productOptions.some((p) => p.id === selectedProduct.id)) {
      list.unshift({ value: String(selectedProduct.id), label: selectedProduct.sku ? `${selectedProduct.name} *(SKU: ${selectedProduct.sku})*` : selectedProduct.name });
    }
    return list;
  }, [productOptions, selectedProduct]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!selectedProduct) {
        setFullProductDetails(null);
        return;
      }
      setProductDetailsLoading(true);
      setFullProductDetails(null);
      try {
        const data = await ProductService.getProduct(selectedProduct.id);
        if (cancelled) return;
        setFullProductDetails(data);
        if (!value) {
          const baseMode = data.saleModes.find((m) => m.baseMode) ?? data.saleModes[0];
          if (baseMode) setUnitType(baseMode.unitType);
        }
      } catch (err) {
        if (cancelled) return;
        toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(err) ?? "No se pudo cargar detalles del producto" });
      } finally {
        if (cancelled) return;
        setProductDetailsLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [selectedProduct]);

  const unitOptions = useMemo(() => {
    if (!fullProductDetails) return [{ value: unitType, label: getProductUnitTypeLabel(unitType) }];
    return fullProductDetails.saleModes.map((m) => ({ value: m.unitType, label: getProductUnitTypeLabel(m.unitType) }));
  }, [fullProductDetails, unitType]);

  useEffect(() => {
    const draft: AdjustmentProductDraft = {
      productId: selectedProduct?.id as number | undefined,
      batchId: batchId === "" ? undefined : Number(batchId),
      quantity: Number(quantity),
      unitType,
      adjustmentType,
      reason: reason?.trim() || undefined,
      productName: selectedProduct?.name ?? "",
      sku: selectedProduct?.sku,
    } as any;

    const nextErrors: Record<string, string> = {};
    if (!draft.productId) nextErrors.productId = "Selecciona un producto";
    if (!draft.quantity || draft.quantity <= 0) nextErrors.quantity = "Ingresa una cantidad válida";
    if (!draft.unitType) nextErrors.unitType = "Selecciona la unidad";
    if (!draft.adjustmentType) nextErrors.adjustmentType = "Selecciona el tipo de ajuste";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) onChange(index, draft);
  }, [selectedProduct, batchId, quantity, unitType, adjustmentType, reason]);

  const summaryText = useMemo(() => {
    if (!fullProductDetails || productDetailsLoading) return null;

    const mode = fullProductDetails.saleModes.find((m) => m.unitType === unitType);
    if (!mode) return null;

    const q = Number(quantity) || 0;
    if (q <= 0) return null;

    const base = getMovementSummaryText(
      q,
      mode.unitType,
      mode.relativeQuantity,
      fullProductDetails.presentation as ProductPresentationType
    );

    return batchId ? `${base} · Lote ID: ${batchId}` : base;
  }, [fullProductDetails, productDetailsLoading, unitType, quantity, batchId]);

  return (
    <fieldset className="rounded-2xl border p-4 space-y-4" aria-labelledby={`adjustment-prod-legend-${index}`}>
      <legend id={`adjustment-prod-legend-${index}`} className="px-1 text-sm font-semibold flex items-center justify-between gap-2">
        <span>Producto #{index + 1}</span>
        <Button type="button" variant="ghost" className="h-8" onClick={() => onRemove(index)} aria-label={`Eliminar producto ${index + 1}`}>Eliminar</Button>
      </legend>

      <div className="space-y-2">
        <FloatingLabelSelect
          id={`productId-${index}`}
          label={productLoading ? "Producto (buscando…)" : "Producto *"}
          aria-label="Producto"
          value={selectedProductId}
          onValueChange={(v) => {
            setSelectedProductId(v);
            const id = v ? parseInt(v) : undefined;
            const found = productOptions.find((p) => p.id === id) || (selectedProduct && selectedProduct.id === id ? selectedProduct : null);
            setSelectedProduct(found ?? null);
          }}
          options={productSelectOptions}
          onSearch={(q) => {
            const query = q?.trim() ?? "";
            if (query) searchProduct(query); else cancelProductSearch();
          }}
          emptyMessage="No se encontraron productos."
          disabled={!!disabled || productLoading}
        />
        {errors.productId && <p className="text-sm text-destructive" role="alert">{errors.productId}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-1">
          <FloatingLabelInput
            id={`quantity-${index}`}
            label="Cantidad"
            type="number"
            step="0.01"
            aria-label="Cantidad"
            value={quantity}
            onChange={(v) => setQuantity(v)}
            disabled={!!disabled}
          />
          {summaryText && (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-1.5" aria-live="polite">{summaryText}</div>
          )}
          {errors.quantity && <p className="text-sm text-destructive" role="alert">{errors.quantity}</p>}
        </div>

        <div className="space-y-2 sm:col-span-1">
          <FloatingLabelSelect
            id={`unitType-${index}`}
            label={productDetailsLoading ? "Unidad (cargando…)" : "Unidad"}
            aria-label="Unidad"
            value={unitType as unknown as string}
            onValueChange={(v) => setUnitType(v as unknown as ProductUnitType)}
            options={unitOptions.map((o) => ({ value: o.value as unknown as string, label: o.label }))}
            disabled={!!disabled || !fullProductDetails || productDetailsLoading}
          />
          {errors.unitType && <p className="text-sm text-destructive" role="alert">{errors.unitType}</p>}
        </div>

        <div className="space-y-2 sm:col-span-1">
          <FloatingLabelInput
            id={`batchId-${index}`}
            label="ID de lote (opcional)"
            type="number"
            aria-label="ID de lote"
            value={batchId}
            onChange={(v) => setBatchId(v)}
            disabled={!!disabled}
          />
          {errors.batchId && <p className="text-sm text-destructive" role="alert">{errors.batchId}</p>}
        </div>

        <div className="space-y-2 sm:col-span-1">
          <FloatingLabelSelect
            id={`adjustmentType-${index}`}
            label="Tipo de ajuste"
            aria-label="Tipo de ajuste"
            value={adjustmentType as unknown as string}
            onValueChange={(v) => setAdjustmentType(v as unknown as AdjustmentType)}
            options={Object.values(AdjustmentType).map((t) => ({ value: t as string, label: AdjustmentTypeLabels[t] }))}
            disabled={!!disabled}
          />
          {errors.adjustmentType && <p className="text-sm text-destructive" role="alert">{errors.adjustmentType}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <FloatingLabelInput
            id={`reason-${index}`}
            label="Motivo (opcional)"
            aria-label="Motivo"
            value={reason}
            onChange={(v) => setReason(v)}
            disabled={!!disabled}
          />
          {errors.reason && <p className="text-sm text-destructive" role="alert">{errors.reason}</p>}
        </div>
      </div>
    </fieldset>
  );
}
