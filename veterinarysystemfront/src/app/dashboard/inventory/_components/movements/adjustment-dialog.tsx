"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import { useUser } from "@/context/user-context";

import { useDebouncedSearch } from "./use-debounced-search";
import ProductService from "../../_service/product-service";
import InventoryMovementService from "../../_service/inventory-movement-service";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useToast } from "@/hooks/use-toast";

import type { ProductQuickSearchResponse } from "../../_types/product-response";
import type { AdjustmentCreateRequest } from "../../_types/inventory-movement-request";

import type { AdjustmentProductDraft } from "./types";
import { AdjustmentForm, adjustmentFormSchema, type AdjustmentFormValues } from "./adjustment-form";
import { AdjustmentProductItemForm } from "./adjustment-product-item-form";
interface AdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBranchId?: number;
  onCreated: () => void;
}

export function AdjustmentDialog({ open, onOpenChange, defaultBranchId, onCreated }: AdjustmentDialogProps) {
  const { userInfo } = useUser();
  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: { branchId: undefined, description: "" },
    mode: "onBlur",
  });

  const branchId = form.watch("branchId");
  const [allBranches, setAllBranches] = useState<BranchResponse[]>([]);
  const {
    options: productOptions,
    setOptions: setProductOptions,
    loading: productLoading,
    search: searchProduct,
    cancel: cancelProductSearch,
  } = useDebouncedSearch<ProductQuickSearchResponse>((query) =>
    ProductService.searchProducts(query, branchId)
  );

  const [items, setItems] = useState<Array<AdjustmentProductDraft | null>>([null]);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setProductOptions([]);
      cancelProductSearch();
      setItems([null]);
      form.reset({ branchId: undefined, description: "" });
      setSubmitting(false);
      return;
    }
    (async () => {
      try {
        const list = await BranchService.getBranches();
        setAllBranches(list);

        const userSelId = userInfo?.selectedBranch?.id ?? 0;
        const effectiveDefault = userSelId && userSelId > 0 ? userSelId : (defaultBranchId ?? undefined);
        if (effectiveDefault) {
          form.setValue("branchId", effectiveDefault, { shouldValidate: true });
        }
      } catch {
        setAllBranches([]);
      }
    })();
  }, [open, defaultBranchId, userInfo?.selectedBranch?.id, form, setProductOptions, cancelProductSearch]);

  const upsertItem = (index: number, draft: AdjustmentProductDraft) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = draft;
      return next;
    });
  };
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const addBlankItem = () => setItems((prev) => [...prev, null]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.branchId) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona la sucursal" });
      return;
    }

    const validProducts: AdjustmentProductDraft[] = [];
    const itemErrors: number[] = [];

    items.forEach((it, idx) => {
      if (it && it.productId && it.quantity && it.unitType && it.adjustmentType) validProducts.push(it);
      else itemErrors.push(idx);
    });

    if (validProducts.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Agrega y completa al menos un producto" });
      return;
    }
    if (itemErrors.length > 0) {
      toast({ variant: "destructive", title: "Revisa tus productos", description: `Hay ${itemErrors.length} bloque(s) con errores` });
      return;
    }

    const payload: AdjustmentCreateRequest = {
      branchId: values.branchId!,
      description: values.description?.trim() || undefined,
      products: validProducts.map((p) => ({
        productId: p.productId,
        batchId: p.batchId,
        quantity: p.quantity,
        unitType: p.unitType,
        adjustmentType: p.adjustmentType,
        reason: p.reason?.trim() || undefined,
      })),
    };

    try {
      setSubmitting(true);
      await InventoryMovementService.createAdjustment(payload);
      toast({ title: "Éxito", description: "Ajuste registrado correctamente" });
      onCreated();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo registrar el ajuste" });
    } finally {
      setSubmitting(false);
    }
  });

  const branchSelectOptions = useMemo<BranchResponse[]>(() => {
    const userSel = userInfo?.selectedBranch;
    if (userSel?.id && userSel.id > 0) {
      const found = allBranches.find((b) => b.id === userSel.id);
      return found ? [found] : [userSel];
    }
    return allBranches;
  }, [allBranches, userInfo?.selectedBranch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,1000px)] max-h-[90vh] overflow-y-auto rounded-lg sm:max-w-4xl" aria-busy={submitting}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">Registrar ajuste</DialogTitle>
          <DialogDescription>Ajusta el stock de la sucursal seleccionada.</DialogDescription>
        </DialogHeader>

        <fieldset className="rounded-lg border p-4">
          <legend className="px-1 text-sm font-semibold">Datos del ajuste</legend>
          <AdjustmentForm
            form={form}
            branchOptions={branchSelectOptions}
          />
        </fieldset>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Productos</h3>
            <Button type="button" variant="ghost" className="h-8" onClick={addBlankItem} disabled={!branchId}>
              <Plus className="h-4 w-4" /> Añadir otro producto
            </Button>
          </div>

          {!branchId && (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              Selecciona la sucursal para buscar productos.
            </div>
          )}

          <div className="space-y-3">
            {items.map((it, idx) => (
              <AdjustmentProductItemForm
                key={idx}
                index={idx}
                value={it}
                onChange={upsertItem}
                onRemove={removeItem}
                productOptions={productOptions}
                productLoading={productLoading}
                searchProduct={searchProduct}
                cancelProductSearch={cancelProductSearch}
                disabled={!branchId}
              />
            ))}
          </div>
        </section>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</span>
            ) : (
              "Guardar ajuste"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}