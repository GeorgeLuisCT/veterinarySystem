"use client";
import { useEffect, useState } from "react";
import type {
  ProductQuickSearchResponse,
} from "../../_types/product-response";
import ProductService from "../../_service/product-service";
import { purchaseProductSchema } from "../../_types/inventory-movement-request";
import type { PurchaseProductDraft } from "./types";
import { Button } from "@/components/ui/button";
import { parseISO, isValid, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import type { PurchaseCreateRequest } from "../../_types/inventory-movement-request";
import type { SupplierQuickSearchResponse } from "../../_types/supplier-response";
import InventoryMovementService from "../../_service/inventory-movement-service";
import SupplierService from "../../_service/supplier-service";
import { useDebouncedSearch } from "./use-debounced-search";
import { PurchaseForm, purchaseFormSchema, type PurchaseFormValues } from "./purchase-form";
import { ProductItemForm } from "./pucharse-product-item-form";

function pad2(n: number) { return String(n).padStart(2, "0"); }
function nowLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
function normalizeLocalDateTimeStrict(v?: string): string {
  if (!v) return "";
  let s = v.trim();
  s = s.replace(/[Zz]$/, "").replace(/([+-]\d{2}:\d{2})$/, "");
  s = s.replace(/\.[\d]{1,3}$/, "");
  const m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?:$|[^:])/);
  if (m) return `${m[1]}:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) return s.slice(0, 19);
  return s;
}
function normalizeDateOnly(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : v;
}

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchOptions: BranchResponse[];
  defaultBranchId?: number;
  onCreated: () => void;
}

export function PurchaseDialog({ open, onOpenChange, branchOptions, defaultBranchId, onCreated }: PurchaseDialogProps) {
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: { branchId: defaultBranchId, supplierId: undefined, date: nowLocal(), description: "" },
    mode: "onBlur",
  });

  const {
    options: supplierOptions,
    setOptions: setSupplierOptions,
    loading: supplierLoading,
    search: searchSupplier,
    cancel: cancelSupplierSearch,
  } = useDebouncedSearch(SupplierService.searchSuppliers);

  const {
    options: productOptions,
    setOptions: setProductOptions,
    loading: productLoading,
    search: searchProduct,
    cancel: cancelProductSearch,
  } = useDebouncedSearch<ProductQuickSearchResponse>((query) =>
    ProductService.searchProducts(query, form.getValues("branchId"))
  );

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierQuickSearchResponse | null>(null);

  const [items, setItems] = useState<Array<PurchaseProductDraft | null>>([null]);

  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedSupplier(null);
      setSupplierOptions([]);
      setProductOptions([]);
      cancelSupplierSearch();
      cancelProductSearch();
      setItems([null]);
      form.reset({ branchId: defaultBranchId, supplierId: undefined, date: nowLocal(), description: "" });
      setSubmitting(false);
    }
  }, [open, defaultBranchId, form, setSupplierOptions, setProductOptions, cancelSupplierSearch, cancelProductSearch]);

  const upsertItem = (index: number, draft: PurchaseProductDraft) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = draft;
      return next;
    });
  };
  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };
  const addBlankItem = () => setItems((prev) => [...prev, null]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.branchId) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona una sucursal" });
      return;
    }
    if (!values.supplierId) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona un proveedor" });
      return;
    }

    const validProducts: PurchaseProductDraft[] = [];
    const itemErrors: Array<{ idx: number; msg: string }> = [];

    items.forEach((it, idx) => {
      const parsed = purchaseProductSchema.safeParse(it ?? {});
      if (parsed.success) {
        const full: PurchaseProductDraft = {
          ...parsed.data,
          productName: (it as PurchaseProductDraft | null)?.productName ?? "",
          sku: (it as PurchaseProductDraft | null)?.sku,
        };
        validProducts.push(full);
      } else {
        itemErrors.push({ idx, msg: parsed.error.issues[0]?.message || "Corrige los campos del producto" });
      }
    });

    if (validProducts.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Agrega y completa al menos un producto" });
      return;
    }
    if (itemErrors.length > 0) {
      toast({ variant: "destructive", title: "Revisa tus productos", description: `Hay ${itemErrors.length} bloque(s) con errores` });
      return;
    }

    const payload: PurchaseCreateRequest = {
      branchId: values.branchId,
      supplierId: values.supplierId,
      date: normalizeLocalDateTimeStrict(values.date),
      description: values.description?.trim() || undefined,
      products: validProducts.map((p) => ({
        productId: p.productId,
        batchNumber: p.batchNumber,
        expirationDate: normalizeDateOnly(p.expirationDate),
        quantity: p.quantity,
        unitType: p.unitType,
        unitCost: p.unitCost,
      })),
    };

    try {
      setSubmitting(true);
      await InventoryMovementService.createPurchase(payload);
      toast({ variant: "default", title: "Éxito", description: "Compra registrada correctamente" });
      onCreated();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo registrar la compra" });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,1000px)] max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-4xl" aria-busy={submitting}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">Registrar compra</DialogTitle>
          <DialogDescription id="purchase-desc">Completa los campos requeridos para registrar la compra.</DialogDescription>
        </DialogHeader>

        <fieldset className="rounded-2xl border p-4">
          <legend className="px-1 text-sm font-semibold">Datos de la compra</legend>
          <PurchaseForm
            form={form}
            branchOptions={branchOptions}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
            supplierOptions={supplierOptions}
            setSupplierOptions={setSupplierOptions}
            supplierLoading={supplierLoading}
            searchSupplier={searchSupplier}
            cancelSupplierSearch={cancelSupplierSearch}
          />
        </fieldset>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Productos y costos</h3>
            <Button type="button" variant="ghost" className="h-8" onClick={addBlankItem}>
              <Plus className="h-4 w-4" /> Añadir otro producto
            </Button>
          </div>

          {items.length === 0 && (
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">No hay productos. Agrega al menos uno.</div>
          )}

          <div className="space-y-3">
            {items.map((it, idx) => (
              <ProductItemForm
                key={idx}
                index={idx}
                value={it}
                onChange={upsertItem}
                onRemove={removeItem}
                productOptions={productOptions}
                productLoading={productLoading}
                searchProduct={searchProduct}
                cancelProductSearch={cancelProductSearch}
                setProductOptions={setProductOptions}
              />
            ))}
          </div>
        </section>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Registrando…</span>
            ) : (
              "Registrar compra"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
