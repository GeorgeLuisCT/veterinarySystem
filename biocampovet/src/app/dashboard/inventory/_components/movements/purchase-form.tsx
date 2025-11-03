"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { SupplierQuickSearchResponse } from "../../_types/supplier-response";
import { Form, FormField, FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { purchaseCreateSchema } from "../../_types/inventory-movement-request";
import { z } from "zod";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { parseISO, isValid, format } from "date-fns";

export const purchaseFormSchema = purchaseCreateSchema.pick({
  branchId: true,
  supplierId: true,
  date: true,
  description: true,
});

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

function normalizeLocalDateTime(value?: string): string {
  if (!value) return "";
  try {
    const d = parseISO(value);
    if (isValid(d)) return format(d, "yyyy-MM-dd'T'HH:mm:ss");
  } catch {}
  const m = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?:$|[^:])/);
  if (m) return `${m[1]}:00`;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value) && value.length >= 19) return value.slice(0, 19);
  return value;
}

interface PurchaseFormProps {
  form: UseFormReturn<PurchaseFormValues>;
  branchOptions: BranchResponse[];
  selectedSupplier: SupplierQuickSearchResponse | null;
  setSelectedSupplier: (supplier: SupplierQuickSearchResponse | null) => void;
  supplierOptions: SupplierQuickSearchResponse[];
  supplierLoading: boolean;
  searchSupplier: (query: string) => void;
}

export function PurchaseForm({
  form,
  branchOptions,
  selectedSupplier,
  setSelectedSupplier,
  supplierOptions,
  supplierLoading,
  searchSupplier,
}: PurchaseFormProps) {
  const supplierSelectOptions = React.useMemo(() => {
    const base = supplierOptions.map((s) => ({
      value: String(s.id),
      label: s.email ? `${s.name} *(${s.email})*` : s.name,
    }));
    if (selectedSupplier && !supplierOptions.some((s) => s.id === selectedSupplier.id)) {
      base.unshift({
        value: String(selectedSupplier.id),
        label: selectedSupplier.email
          ? `${selectedSupplier.name} *(${selectedSupplier.email})*`
          : selectedSupplier.name,
      });
    }
    return base;
  }, [supplierOptions, selectedSupplier]);

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id="branchId"
                    label="Sucursal *"
                    value={field.value != null ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(v ? parseInt(v) : undefined)}
                    options={branchOptions.map((b) => ({
                      value: String(b.id),
                      label: b.name,
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelDateInput
                    id="date"
                    label="Fecha y hora"
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(normalizeLocalDateTime(v))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormControl>
                  <FloatingLabelSelect
                    id="supplierId"
                    label={supplierLoading ? "Proveedor (buscando...)" : "Proveedor *"}
                    value={field.value != null ? String(field.value) : ""}
                    onValueChange={(v) => {
                      const id = v ? parseInt(v) : undefined;
                      field.onChange(id);
                      const found =
                        supplierOptions.find((s) => s.id === id) ??
                        (selectedSupplier && selectedSupplier.id === id ? selectedSupplier : null);
                      setSelectedSupplier(found ?? null);
                    }}
                    options={supplierSelectOptions}
                    onSearch={(q) => {
                      const query = q?.trim() ?? "";
                      if (query) searchSupplier(query);
                    }}
                    emptyMessage="No se encontraron proveedores."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="Comentarios adicionales" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
