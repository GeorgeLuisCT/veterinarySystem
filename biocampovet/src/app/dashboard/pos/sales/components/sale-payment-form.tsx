"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useSales } from "../context/sales-context-type";
import { PaymentMethodResponse } from "@/app/dashboard/cashbox/types/payment-method-response";
import { paymentMethodService } from "@/app/dashboard/cashbox/service/payment-methods-service";
import { Loader2 } from "lucide-react";
import { salePaymentFormSchema, SalePaymentFormValues } from "../types/sale-payment-request";
import { FloatingLabelInput } from "@/components/floating-label-input";

export function SalePaymentForm({
  totalAmount,
  currentSaleId,
}: {
  totalAmount: number;
  currentSaleId: string;
}) {
  const { sales, updateSaleState } = useSales();
  const currentSale = sales[currentSaleId];

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);

  const form = useForm<SalePaymentFormValues>({
    resolver: zodResolver(salePaymentFormSchema),

    defaultValues: {
      payments:
        currentSale.payments?.map((p) => ({
          methodId: p.methodId ?? "",
          amount: p.amount ?? 0,
        })) ?? [{ methodId: "", amount: 0 }],
    },
  });

  const { control, handleSubmit, watch, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "payments" });
  const totalPaid = watch("payments")?.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const data = await paymentMethodService.getAllActive();
        setPaymentMethods(data);
      } catch (err) {
        console.error("Error al cargar métodos de pago", err);
      } finally {
        setLoadingMethods(false);
      }
    };
    fetchMethods();
  }, []);

  const onSubmit = (data: SalePaymentFormValues) => {
    updateSaleState({ payments: data.payments });
  };

  return (
    <Form {...form}>
      <form onBlur={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-base font-semibold">Métodos de pago</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ methodId: "", amount: 0 })}
          >
            + Agregar
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-start">
            {/* Método de pago */}
            <FormField
              control={control}
              name={`payments.${index}.methodId`}
              render={({ field }) => (
                <FormItem className="flex-1 relative">
                  <FormControl>
                    <FloatingLabelSelect
                      id={`payment-method-${index}`}
                      label={`Método ${index + 1}`}
                      value={field.value}
                      onValueChange={(val) => field.onChange(val)}
                      options={paymentMethods.map((pm) => ({
                        value: String(pm.id),
                        label: pm.name,
                      }))}
                      placeholder="Selecciona método"
                      disabled={loadingMethods}
                    />
                  </FormControl>
                  {(formState.touchedFields.payments?.[index]?.methodId ||
                    formState.isSubmitted) && <FormMessage className="ml-2" />}
                  {loadingMethods && (
                    <div className="absolute top-1/2 right-3 -translate-y-1/2 z-10">
                      <Loader2 className="animate-spin w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Monto */}
            <FormField
              control={control}
              name={`payments.${index}.amount`}
              render={({ field }) => (
                <FormItem className="w-36">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id={`payments.${index}.amount`}
                      type="number"
                      label="Monto S/."
                      onChange={(value) => field.onChange(parseFloat(value) || 0)}
                    />
                  </FormControl>
                  {(formState.touchedFields.payments?.[index]?.amount ||
                    formState.isSubmitted) && <FormMessage className="ml-2" />}
                </FormItem>
              )}
            />

            {/* Botón eliminar */}
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
              >
                ✕
              </Button>
            )}
          </div>
        ))}

        {/* Totales */}
        <div className="flex flex-col items-end mt-4">
          <div className="font-semibold text-lg">Total: S/.{totalAmount.toFixed(2)}</div>
          <div className="text-sm mt-2">
            <span className="font-medium">Total pagado:</span> S/.{totalPaid.toFixed(2)}
          </div>
        </div>
      </form>
    </Form>
  );
}
