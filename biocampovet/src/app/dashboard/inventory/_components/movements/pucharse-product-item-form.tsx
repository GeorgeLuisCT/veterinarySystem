"use client";
import { useEffect, useMemo, useState } from "react";
import type {
  ProductQuickSearchResponse,
  ProductResponse,
} from "../../_types/product-response";
import { ProductUnitType, getProductUnitTypeLabel } from "../../_enums/product-unit-type";
import {
  ProductPresentationType,
  getProductPresentationTypeLabel,
} from "../../_enums/product-presentation-type";
import ProductService from "../../_service/product-service";
import { purchaseProductSchema } from "../../_types/inventory-movement-request";
import type { PurchaseProductDraft } from "./types";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { Button } from "@/components/ui/button";
import { parseISO, isValid, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { getPurchaseSummaryText } from "../../_utils/product-util-labels";

function normalizeLocalDate(value?: string): string {
  if (!value) return "";
  try {
    const d = parseISO(value);
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  } catch { }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return value;
}

export interface ProductItemFormProps {
  index: number;
  value: PurchaseProductDraft | null;
  onChange: (index: number, draft: PurchaseProductDraft) => void;
  onRemove: (index: number) => void;
  productOptions: ProductQuickSearchResponse[];
  productLoading: boolean;
  searchProduct: (q: string) => void;
  cancelProductSearch: () => void;
  setProductOptions: (v: ProductQuickSearchResponse[]) => void;
}

export function ProductItemForm({
  index,
  value,
  onChange,
  onRemove,
  productOptions,
  productLoading,
  searchProduct,
  cancelProductSearch,
}: ProductItemFormProps) {
  const { toast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<ProductQuickSearchResponse | null>(
    value ? { id: value.productId, name: value.productName ?? "", sku: value.sku } as any : null
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(value ? String(value.productId) : "");
  const [fullProductDetails, setFullProductDetails] = useState<ProductResponse | null>(null);
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);

  const [quantity, setQuantity] = useState<string>(value ? String(value.quantity) : "1");
  const [unitType, setUnitType] = useState<ProductUnitType>(value?.unitType ?? ProductUnitType.UNIT);
  const [unitCost, setUnitCost] = useState<string>(value ? String(value.unitCost) : "0");
  const [batchNumber, setBatchNumber] = useState<string>(value?.batchNumber ?? "");
  const [expirationDate, setExpirationDate] = useState<string>(normalizeLocalDate(value?.expirationDate));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const productSelectOptions = useMemo(() => {
    const list = productOptions.map((p) => ({
      value: String(p.id),
      label: p.sku ? `${p.name} *(SKU: ${p.sku})*` : p.name,
    }));
    if (selectedProduct && !productOptions.some((p) => p.id === selectedProduct.id)) {
      list.unshift({
        value: String(selectedProduct.id),
        label: selectedProduct.sku
          ? `${selectedProduct.name} *(SKU: ${selectedProduct.sku})*`
          : selectedProduct.name,
      });
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

  const purchaseUnitOptions = useMemo(() => {
    if (!fullProductDetails) return [{ value: unitType, label: getProductUnitTypeLabel(unitType) }];
    return fullProductDetails.saleModes.map((m) => ({
      value: m.unitType,
      label: m.unitType === ProductUnitType.UNIT
        ? getProductPresentationTypeLabel(fullProductDetails.presentation as ProductPresentationType)
        : getProductUnitTypeLabel(m.unitType),
    }));
  }, [fullProductDetails, unitType]);

  const summaryText = useMemo(() => {
    if (!fullProductDetails || !unitType || productDetailsLoading) return null;
    const selectedMode = fullProductDetails.saleModes.find((m) => m.unitType === unitType);
    if (!selectedMode) return null;
    const q = Number(quantity) || 0;
    const cost = Number(unitCost) || 0;
    return `${getPurchaseSummaryText(q, selectedMode.unitType, selectedMode.relativeQuantity, fullProductDetails.presentation as ProductPresentationType)} a S/ ${cost.toFixed(2)}`;
  }, [fullProductDetails, productDetailsLoading, unitType, quantity, unitCost]);

  useEffect(() => {
    const productId = selectedProduct ? selectedProduct.id : undefined;
    const draft = {
      productId,
      batchNumber,
      expirationDate: expirationDate || undefined,
      quantity: Number(quantity),
      unitType,
      unitCost: Number(unitCost),
      productName: selectedProduct?.name,
      sku: selectedProduct?.sku,
    } as any;

    const parsed = purchaseProductSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        next[k] = issue.message;
      }
      setErrors(next);
    } else {
      setErrors({});
      const draftValidated: PurchaseProductDraft = {
        ...parsed.data,
        productName: selectedProduct?.name ?? "",
        sku: selectedProduct?.sku,
      };
      onChange(index, draftValidated);
    }
  }, [selectedProduct, batchNumber, expirationDate, quantity, unitType, unitCost]);

  return (
    <fieldset className="rounded-2xl border p-4 space-y-4" aria-labelledby={`prod-legend-${index}`}>
      <legend id={`prod-legend-${index}`} className="px-1 text-sm font-semibold flex items-center justify-between gap-2">
        <span>Producto #{index + 1}</span>
        <Button type="button" variant="ghost" className="h-8" onClick={() => onRemove(index)} aria-label={`Eliminar producto ${index + 1}`}>
          Eliminar
        </Button>
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
          disabled={productLoading}
        />
        {errors.productId && <p className="text-sm text-destructive" role="alert">{errors.productId}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FloatingLabelInput
            id={`quantity-${index}`}
            label="Cantidad"
            type="number"
            step="0.01"
            aria-label="Cantidad"
            value={quantity}
            onChange={(v) => setQuantity(v)}
          />
          {errors.quantity && <p className="text-sm text-destructive" role="alert">{errors.quantity}</p>}
        </div>
        <div className="space-y-2">
          <FloatingLabelSelect
            id={`unitType-${index}`}
            label={productDetailsLoading ? "Unidad (cargando…)" : "Unidad"}
            aria-label="Unidad"
            value={unitType as unknown as string}
            onValueChange={(v) => setUnitType(v as unknown as ProductUnitType)}
            options={purchaseUnitOptions.map((o) => ({ value: o.value as unknown as string, label: o.label }))}
            disabled={!fullProductDetails || productDetailsLoading}
          />
          {summaryText && (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-1.5" aria-live="polite">{summaryText}</div>
          )}
          {errors.unitType && <p className="text-sm text-destructive" role="alert">{errors.unitType}</p>}
        </div>
        <div className="space-y-2">
          <FloatingLabelInput
            id={`unitCost-${index}`}
            label="Costo unitario (S/)"
            type="number"
            step="0.01"
            aria-label="Costo unitario"
            value={unitCost}
            onChange={(v) => setUnitCost(v)}
          />
          {errors.unitCost && <p className="text-sm text-destructive" role="alert">{errors.unitCost}</p>}
        </div>
        <div className="space-y-2">
          <FloatingLabelInput
            id={`batchNumber-${index}`}
            label="Número de lote"
            aria-label="Número de lote"
            value={batchNumber}
            onChange={(v) => setBatchNumber(v)}
          />
          {errors.batchNumber && <p className="text-sm text-destructive" role="alert">{errors.batchNumber}</p>}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <FloatingLabelDateInput
            id={`expirationDate-${index}`}
            label="Vencimiento (opcional)"
            aria-label="Vencimiento"
            value={expirationDate}
            onChange={(v) => setExpirationDate(normalizeLocalDate(v))}
          />
          {errors.expirationDate && <p className="text-sm text-destructive" role="alert">{errors.expirationDate}</p>}
        </div>
      </div>
    </fieldset>
  );
}