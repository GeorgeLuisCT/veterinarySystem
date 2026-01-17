"use client";

import * as React from "react";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
import { Form, FormField, FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { adjustmentCreateSchema } from "../../_types/inventory-movement-request";

export const adjustmentFormSchema = adjustmentCreateSchema.pick({
  branchId: true,
  description: true,
});

export type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

interface AdjustmentFormProps {
  form: UseFormReturn<AdjustmentFormValues>;
  branchOptions: BranchResponse[];
}

export function AdjustmentForm({ form, branchOptions }: AdjustmentFormProps) {
  const branchOpts = React.useMemo(
    () => branchOptions.map((b) => ({ value: String(b.id), label: b.name })),
    [branchOptions]
  );

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
                  options={branchOpts}
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
