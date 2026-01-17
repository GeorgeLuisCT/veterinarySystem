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
import type { TransferCreateRequest } from "../../_types/inventory-movement-request";

import type { TransferProductDraft } from "./types";
import { TransferForm, transferFormSchema, type TransferFormValues } from "./transfer-form";
import { TransferProductItemForm } from "./transfer-product-item-form";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSourceBranchId?: number;
  onCreated: () => void;
}

export function TransferDialog({ open, onOpenChange, defaultSourceBranchId, onCreated }: TransferDialogProps) {
  const { userInfo } = useUser();
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: { sourceBranchId: undefined, targetBranchId: undefined, description: "" },
    mode: "onBlur",
  });

  const sourceBranchId = form.watch("sourceBranchId");
  const [allBranches, setAllBranches] = useState<BranchResponse[]>([]);
  const {
    options: productOptions,
    setOptions: setProductOptions,
    loading: productLoading,
    search: searchProduct,
    cancel: cancelProductSearch,
  } = useDebouncedSearch<ProductQuickSearchResponse>((query) =>
    ProductService.searchProducts(query, sourceBranchId)
  );

  const [items, setItems] = useState<Array<TransferProductDraft | null>>([null]);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setProductOptions([]);
      cancelProductSearch();
      setItems([null]);
      form.reset({ sourceBranchId: undefined, targetBranchId: undefined, description: "" });
      setSubmitting(false);
      return;
    }
    (async () => {
      try {
        const list = await BranchService.getBranches();
        setAllBranches(list);

        const userSelId = userInfo?.selectedBranch?.id ?? 0;
        const effectiveDefault =
          userSelId && userSelId > 0 ? userSelId : (defaultSourceBranchId ?? undefined);

        if (effectiveDefault) {
          form.setValue("sourceBranchId", effectiveDefault, { shouldValidate: true });
        }
      } catch {
        setAllBranches([]);
      }
    })();
  }, [open, defaultSourceBranchId, userInfo?.selectedBranch?.id, form, setProductOptions, cancelProductSearch]);

  useEffect(() => {
    const target = form.getValues("targetBranchId");
    if (target && sourceBranchId && target === sourceBranchId) {
      form.setValue("targetBranchId", 0, { shouldValidate: true, shouldDirty: true });
    }
  }, [sourceBranchId]);

  const upsertItem = (index: number, draft: TransferProductDraft) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = draft;
      return next;
    });
  };
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const addBlankItem = () => setItems((prev) => [...prev, null]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.sourceBranchId) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona la sucursal de origen" });
      return;
    }
    if (!values.targetBranchId) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona la sucursal de destino" });
      return;
    }

    const validProducts: TransferProductDraft[] = [];
    const itemErrors: number[] = [];

    items.forEach((it, idx) => {
      if (it && it.productId && it.quantity && it.unitType) validProducts.push(it);
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

    const payload: TransferCreateRequest = {
      sourceBranchId: values.sourceBranchId!,
      targetBranchId: values.targetBranchId!,
      description: values.description?.trim() || undefined,
      products: validProducts.map((p) => ({
        productId: p.productId,
        batchId: p.batchId,
        quantity: p.quantity,
        unitType: p.unitType,
      })),
    };

    try {
      setSubmitting(true);
      await InventoryMovementService.createTransfer(payload);
      toast({ title: "Éxito", description: "Transferencia registrada correctamente" });
      onCreated();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudo registrar la transferencia" });
    } finally {
      setSubmitting(false);
    }
  });

  const sourceOptions = useMemo<BranchResponse[]>(() => {
    const userSel = userInfo?.selectedBranch;
    if (userSel?.id && userSel.id > 0) {
      const found = allBranches.find((b) => b.id === userSel.id);
      return found ? [found] : [userSel];
    }
    return allBranches;
  }, [allBranches, userInfo?.selectedBranch]);

  const targetOptions = useMemo<BranchResponse[]>(() => {
    if (!sourceBranchId || sourceBranchId === 0) return allBranches;
    return allBranches.filter((b) => b.id !== sourceBranchId);
  }, [allBranches, sourceBranchId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,1000px)] max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-4xl" aria-busy={submitting}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">Registrar transferencia</DialogTitle>
          <DialogDescription>Desplaza stock entre sucursales.</DialogDescription>
        </DialogHeader>

        <fieldset className="rounded-2xl border p-4">
          <legend className="px-1 text-sm font-semibold">Datos de la transferencia</legend>
          <TransferForm
            form={form}
            sourceOptions={sourceOptions}
            targetOptions={targetOptions}
          />
        </fieldset>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Productos</h3>
            <Button type="button" variant="ghost" className="h-8" onClick={addBlankItem} disabled={!sourceBranchId}>
              <Plus className="h-4 w-4" /> Añadir otro producto
            </Button>
          </div>

          {!sourceBranchId && (
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              Selecciona la sucursal de origen para buscar productos.
            </div>
          )}

          <div className="space-y-3">
            {items.map((it, idx) => (
              <TransferProductItemForm
                key={idx}
                index={idx}
                value={it}
                onChange={upsertItem}
                onRemove={removeItem}
                productOptions={productOptions}
                productLoading={productLoading}
                searchProduct={searchProduct}
                cancelProductSearch={cancelProductSearch}
                disabled={!sourceBranchId}
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
              "Guardar transferencia"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
