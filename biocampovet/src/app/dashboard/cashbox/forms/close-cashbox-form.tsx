"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloseCashboxRequest, CloseCashboxRequestSchema } from "../types/cashbox-requests";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import CashBoxService from "../service/cashbox-service";
import { toast } from "sonner";
import { getAaxiosErrorMessage } from "@/helpers/error";

interface CloseCashBoxFormProps {
  cashboxId: number;
  onSuccess: (closedCashboxId: number) => void;
}

export const CloseCashBoxForm: React.FC<CloseCashBoxFormProps> = ({ cashboxId, onSuccess }) => {
  const form = useForm<CloseCashboxRequest>({
    resolver: zodResolver(CloseCashboxRequestSchema),
    defaultValues: {
      cashboxId,
      physicalAmount: 0,
      closingObservations: "",
    },
  });

  const onSubmit = async (data: CloseCashboxRequest) => {
    try {
      const closedId = await CashBoxService.closeCashBox(data);
      toast.success("Caja cerrada correctamente");
      onSuccess(closedId);
    } catch (error: unknown) {
      toast.error(getAaxiosErrorMessage(error) || "Error al cerrar la caja");
      console.error("Error al cerrar caja:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <FormField
          control={form.control}
          name="physicalAmount"
          render={({ field }) => (
            <FormItem className="gap-0">
              <FormControl>
                <FloatingLabelInput
                  {...field}
                  id="physicalAmount"
                  type="number"
                  step="0.01"
                  label="Monto físico contado"
                  disabled={form.formState.isSubmitting}
                  onChange={(value) => field.onChange(parseFloat(value) || 0)}
                />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="closingObservations"
          render={({ field }) => (
            <FormItem className="gap-0">
              <FormControl>
                <FloatingLabelInput
                  {...field}
                  id="closingObservations"
                  label="Observaciones de cierre"
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Cerrando..." : "Cerrar Caja"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
