import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OpenCashboxRequestSchema, type OpenCashboxRequest } from "../types/cashbox-requests";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import CashBoxService from "../service/cashbox-service";
import { toast } from "sonner";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { getAaxiosErrorMessage } from "@/helpers/error";

interface OpenCashBoxFormProps {
  branchId: number;
  onSuccess: (newCashBoxId: number) => void;
}

export const OpenCashBoxForm: React.FC<OpenCashBoxFormProps> = ({ branchId, onSuccess }) => {
  const form = useForm<OpenCashboxRequest>({
    resolver: zodResolver(OpenCashboxRequestSchema),
    defaultValues: {
      branchId,
      initialAmount: 0,
    },
  });

  useEffect(() => {
    form.setValue("branchId", branchId);
  }, [branchId, form]);

  const onSubmit = async (values: OpenCashboxRequest) => {
    try {
      const newId = await CashBoxService.openCashBox(values);
      onSuccess(newId);
    } catch (error: unknown) {
      toast.error(getAaxiosErrorMessage(error) || "Error al abrir la caja");
      console.error("Error al abrir caja:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <FormField
          control={form.control}
          name="initialAmount"
          render={({ field }) => (
            <FormItem className="gap-0">
              <FormControl>
                <FloatingLabelInput
                  {...field}
                  id="initialAmount"
                  type="number"
                  step="0.01"
                  label="Monto Inicial"
                  disabled={form.formState.isSubmitting}
                  onChange={(value) => field.onChange(parseFloat(value) || 0)}
                />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Abriendo..." : "Abrir Caja"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
