"use client";

import * as React from "react";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
import { Form, FormField, FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { transferCreateBaseSchema } from "../../_types/inventory-movement-request";

export const transferFormSchema = transferCreateBaseSchema.pick({
  sourceBranchId: true,
  targetBranchId: true,
  description: true,
});

export type TransferFormValues = z.infer<typeof transferFormSchema>;

interface TransferFormProps {
  form: UseFormReturn<TransferFormValues>;
  sourceOptions: BranchResponse[];
  targetOptions: BranchResponse[];
}

export function TransferForm({ form, sourceOptions, targetOptions }: TransferFormProps) {
  const srcOpts = React.useMemo(
    () => sourceOptions.map((b) => ({ value: String(b.id), label: b.name })),
    [sourceOptions]
  );
  const dstOpts = React.useMemo(
    () => targetOptions.map((b) => ({ value: String(b.id), label: b.name })),
    [targetOptions]
  );

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="sourceBranchId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id="sourceBranchId"
                    label="Sucursal de origen *"
                    value={field.value != null ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(v ? parseInt(v) : undefined)}
                    options={srcOpts}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetBranchId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelSelect
                    id="targetBranchId"
                    label="Sucursal de destino *"
                    value={field.value != null ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(v ? parseInt(v) : undefined)}
                    options={dstOpts}
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
                <Textarea {...field} rows={3} placeholder="Notas (opcional)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
