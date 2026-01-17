// app/dashboard/finance/_components/account-payable-create-dialog.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { AccountPayableFormValues, accountPayableSchema } from "../_schemas/account-payable-schema";
import { SupplierQuickSearchResponse } from "../../inventory/_types/supplier-response";
import SupplierService from "../../inventory/_service/supplier-service";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: AccountPayableFormValues) => Promise<void> | void;
};

function toLocalDateTimeInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function AccountPayableCreateDialog({ open, onOpenChange, onSubmit }: Props) {
  const form = useForm<AccountPayableFormValues>({
    resolver: zodResolver(accountPayableSchema),
    defaultValues: {
      supplierId: undefined,
      description: "",
      issueDateTime: toLocalDateTimeInputValue(new Date()),
      totalAmount: 0,
    },
    mode: "onChange",
  });

  const [supplierOptions, setSupplierOptions] = useState<SupplierQuickSearchResponse[]>([]);
  const [supplierLoading, setSupplierLoading] = useState(false);

  useEffect(() => {
    if (open) {
      form.reset({
        supplierId: undefined,
        description: "",
        issueDateTime: toLocalDateTimeInputValue(new Date()),
        totalAmount: 0,
      });
      setSupplierOptions([]);
      setSupplierLoading(false);
    }
  }, [open, form]);

  const selectOptions = useMemo(
    () =>
      supplierOptions.map((s) => ({
        value: String(s.id),
        label: s.name ? `${s.name} (${s.email ?? "sin email"})` : s.name,
      })),
    [supplierOptions]
  );

  const handleSearchSuppliers = async (q?: string) => {
    const query = (q ?? "").trim();
    if (!query) {
      setSupplierOptions([]);
      return;
    }
    setSupplierLoading(true);
    try {
      const res = await SupplierService.searchSuppliers(query);
      setSupplierOptions(res);
    } finally {
      setSupplierLoading(false);
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      supplierId: values.supplierId,
      description: values.description.trim(),
      issueDateTime: values.issueDateTime,
      totalAmount: values.totalAmount,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta por pagar</DialogTitle>
          <DialogDescription>Registra manualmente una obligación con proveedor o servicio externo.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="supplierId"
                      label={supplierLoading ? "Proveedor (buscando…)" : "Proveedor (Opcional)"}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                      options={selectOptions}
                      onSearch={handleSearchSuppliers}
                      emptyMessage="Sin resultados"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput id="description" label="Descripción" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelDateInput
                      id="issueDateTime"
                      label="Fecha y hora de emisión"
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="totalAmount"
                      label="Total"
                      type="number"
                      step="0.01"
                      value={Number.isNaN(field.value as number) ? "" : String(field.value)}
                      onChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
