// app/dashboard/grooming/components/grooming/add-material-modal.tsx
"use client";

import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { ProductQuickSearchResponse } from "@/app/dashboard/inventory/products/types/product-quick-search-response";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { AddGroomingMaterialRequest } from "../types/grooming-session-request";

type Props = {
  sessionId: number;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddGroomingMaterialRequest) => Promise<void>;
};

const schema = z
  .object({
    productId: z.number().int().min(1).optional().nullable(),
    unregisteredProductName: z
      .string()
      .transform((v) => v?.trim() || "")
      .optional()
      .nullable(),
    quantity: z
      .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)), z.number().positive())
      .refine((v) => v !== undefined, "Cantidad obligatoria"),
    unitType: z.nativeEnum(ProductUnitType, { errorMap: () => ({ message: "Unidad inválida" }) }),
    unitPrice: z
      .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)), z.number().nonnegative())
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    const hasProduct = data.productId !== null && data.productId !== undefined;
    const hasName = !!(data.unregisteredProductName && data.unregisteredProductName.trim() !== "");
    if (hasProduct === hasName) {
      ctx.addIssue({ path: ["productId"], code: z.ZodIssueCode.custom, message: "Indica producto o nombre libre, no ambos" });
      ctx.addIssue({ path: ["unregisteredProductName"], code: z.ZodIssueCode.custom, message: "Indica producto o nombre libre, no ambos" });
    }
  });

const unitOptions = (Object.values(ProductUnitType) as ProductUnitType[]).map((u) => ({
  value: u,
  label: ProductUnitTypeLabels[u],
}));

export function AddGroomingMaterialModal({ sessionId, open, onClose, onSubmit }: Props) {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const [productInput, setProductInput] = React.useState("");
  const [results, setResults] = React.useState<ProductQuickSearchResponse[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selected, setSelected] = React.useState<{ id: number; label: string } | null>(null);
  const timeoutRef = React.useRef<number | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: null,
      unregisteredProductName: null,
      quantity: undefined as unknown as number,
      unitType: undefined as unknown as ProductUnitType,
      unitPrice: null,
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (!open) return;
    setProductInput("");
    setResults([]);
    setSearching(false);
    setSelected(null);
    form.reset({
      productId: null,
      unregisteredProductName: null,
      quantity: undefined as unknown as number,
      unitType: undefined as unknown as ProductUnitType,
      unitPrice: null,
    });
  }, [open, form]);

  const handleInputChange = React.useCallback(
    (value: string) => {
      setProductInput(value);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      const trimmed = value.trim();
      if (!trimmed) {
        setResults([]);
        setSearching(false);
        return;
      }
      timeoutRef.current = window.setTimeout(async () => {
        try {
          setSearching(true);
          const branchId = userInfo?.selectedBranch?.id ?? 0;
          const data = await ProductService.searchProducts(trimmed, branchId > 0 ? branchId : undefined);
          setResults(data);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      }, 400);
    },
    [userInfo?.selectedBranch?.id]
  );

  const handlePick = React.useCallback(
    (p: ProductQuickSearchResponse) => {
      const label = p.sku ? `${p.name} (${p.sku})` : p.name;
      setSelected({ id: p.id, label });
      setProductInput("");
      setResults([]);
      form.setValue("productId", p.id, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      form.setValue("unregisteredProductName", null, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    },
    [form]
  );

  const removeSelected = React.useCallback(() => {
    setSelected(null);
    form.setValue("productId", null, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  }, [form]);

  const submit = form.handleSubmit(async (values) => {
    const payload: AddGroomingMaterialRequest = {
      productId: values.productId ?? undefined,
      unregisteredProductName: values.unregisteredProductName ? values.unregisteredProductName.trim() : undefined,
      quantity: Number(values.quantity),
      unitType: values.unitType,
      unitPrice: values.unitPrice ?? undefined,
    };
    try {
      await onSubmit(payload);
      toast({ title: "Material agregado", description: "Se registró el material en la sesión." });
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el material." });
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar material</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Producto del inventario</p>
                {selected ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {selected.label}
                    <button type="button" onClick={removeSelected} aria-label="Quitar producto">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null}
              </div>
              {!selected && (
                <>
                  <Input
                    value={productInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Busca por nombre o SKU"
                    autoComplete="off"
                  />
                  {productInput.trim().length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-md border border-dashed border-border">
                      {searching ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Buscando…</div>
                      ) : results.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados.</div>
                      ) : (
                        results.map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => handlePick(p)}
                          >
                            <span>{p.name}</span>
                            <span className="text-xs text-muted-foreground">{p.sku}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {!selected && (
              <FormField
                control={form.control}
                name="unregisteredProductName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="unregisteredProductName"
                        label="Nombre libre (si no existe en inventario)"
                        value={field.value ?? ""}
                        onChange={(v) => field.onChange(v === "" ? null : v)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="quantity"
                        type="number"
                        step="0.001"
                        label="Cantidad"
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onChange={(v) => field.onChange(v === "" ? undefined : Number(v))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="unitType"
                        label="Unidad"
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v as ProductUnitType)}
                        options={unitOptions}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="unitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      label="Precio unitario (opcional)"
                      value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                      onChange={(v) => field.onChange(v === "" ? null : Number(v))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[7rem]">
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Agregar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { AddGroomingMaterialModal as default };
