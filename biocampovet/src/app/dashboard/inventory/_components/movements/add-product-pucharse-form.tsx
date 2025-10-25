"use client";

import { useEffect, useMemo, useState } from "react";
import { Dispatch, SetStateAction } from "react";
import { PurchaseProductDraft } from "./types";
import { ProductUnitType } from "../../_enums/product-unit-type";
import { ProductQuickSearchResponse } from "../../_types/product-response";
import { purchaseProductSchema } from "../../_types/inventory-movement-request";
import { Button } from "@/components/ui/button";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { parseISO, isValid, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function normalizeLocalDate(value?: string): string {
  if (!value) return "";
  try {
    const d = parseISO(value);
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  } catch {}
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return value;
}

interface AddProductPurchaseFormProps {
  onAdd: (product: PurchaseProductDraft) => void;
  onCancel: () => void;
  unitOptions: { value: ProductUnitType; label: string }[];
  productOptions: ProductQuickSearchResponse[];
  searchProduct: (query: string) => void;
  cancelProductSearch: () => void;
  setProductOptions: Dispatch<SetStateAction<ProductQuickSearchResponse[]>>;
  productLoading: boolean;
  isOpen: boolean;
}

export function AddProductPurchaseForm({
  onAdd,
  onCancel,
  unitOptions,
  productOptions,
  searchProduct,
  cancelProductSearch,
  setProductOptions,
  productLoading,
  isOpen,
}: AddProductPurchaseFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductQuickSearchResponse | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [unitType, setUnitType] = useState<ProductUnitType>(ProductUnitType.UNIT);
  const [unitCost, setUnitCost] = useState("0");
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

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
    if (!isOpen) {
      setSelectedProduct(null);
      setSelectedProductId("");
      setQuantity("1");
      setUnitType(ProductUnitType.UNIT);
      setUnitCost("0");
      setBatchNumber("");
      setExpirationDate("");
      setErrors({});
      cancelProductSearch();
      setProductOptions([]);
    }
  }, [isOpen, cancelProductSearch, setProductOptions]);

  const handleSubmit = () => {
    if (!selectedProduct) {
      setErrors({ productId: "Selecciona un producto" });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona un producto",
      });
      return;
    }

    const parsed = purchaseProductSchema.safeParse({
      productId: selectedProduct.id,
      batchNumber,
      expirationDate: expirationDate || undefined,
      quantity: Number(quantity),
      unitType,
      unitCost: Number(unitCost),
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "form");
        nextErrors[key] = issue.message;
      });
      setErrors(nextErrors);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Corrige los campos del producto",
      });
      return;
    }

    onAdd({
      ...parsed.data,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium">Añadir producto</h4>

      <div className="space-y-2">
        <FloatingLabelSelect
          id="productId"
          label={productLoading ? "Producto (buscando...)" : "Producto *"}
          value={selectedProductId}
          onValueChange={(v) => {
            setSelectedProductId(v);
            const id = v ? parseInt(v) : undefined;
            const found =
              productOptions.find((p) => p.id === id) ??
              (selectedProduct && selectedProduct.id === id ? selectedProduct : null);
            setSelectedProduct(found ?? null);
            setErrors((prev) => ({ ...prev, productId: "" }));
          }}
          options={productSelectOptions}
          onSearch={(q) => {
            const query = q?.trim() ?? "";
            if (query) searchProduct(query);
            else cancelProductSearch();
          }}
          emptyMessage="No se encontraron productos."
        />
        {errors.productId && <p className="text-sm text-destructive">{errors.productId}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <FloatingLabelInput
            id="quantity"
            label="Cantidad"
            type="number"
            step="0.01"
            value={quantity}
            onChange={(v) => setQuantity(v)}
          />
          {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
        </div>

        <div className="space-y-2">
          <FloatingLabelSelect
            id="unitType"
            label="Unidad"
            value={unitType as unknown as string}
            onValueChange={(v) => setUnitType(v as unknown as ProductUnitType)}
            options={unitOptions.map((o) => ({ value: o.value as unknown as string, label: o.label }))}
          />
          {errors.unitType && <p className="text-sm text-destructive">{errors.unitType}</p>}
        </div>

        <div className="space-y-2">
          <FloatingLabelInput
            id="unitCost"
            label="Costo unitario (S/)"
            type="number"
            step="0.01"
            value={unitCost}
            onChange={(v) => setUnitCost(v)}
          />
          {errors.unitCost && <p className="text-sm text-destructive">{errors.unitCost}</p>}
        </div>

        <div className="space-y-2">
          <FloatingLabelInput
            id="batchNumber"
            label="Número de lote"
            value={batchNumber}
            onChange={(v) => setBatchNumber(v)}
          />
          {errors.batchNumber && <p className="text-sm text-destructive">{errors.batchNumber}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <FloatingLabelDateInput
            id="expirationDate"
            label="Vencimiento (opcional)"
            value={expirationDate}
            onChange={(v) => setExpirationDate(normalizeLocalDate(v))}
          />
          {errors.expirationDate && <p className="text-sm text-destructive">{errors.expirationDate}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>Agregar producto</Button>
      </div>
    </div>
  );
}
