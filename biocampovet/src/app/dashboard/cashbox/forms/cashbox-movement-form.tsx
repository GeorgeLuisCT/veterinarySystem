"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CashboxMovementRequestSchema,
  CashboxMovementRequest,
} from "../types/cashbox-movement-request";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import CashboxMovementService from "../service/cashbox-movement-service";
import { toast } from "sonner";
import {
  CashboxMovementType,
  CashboxMovementTypeLabels,
} from "../enums/cashbox-movement-type";
import {
  CashboxMovementReason,
  CashboxMovementReasonLabels,
} from "../enums/cashbox-movement-reason";
import { paymentMethodService } from "@/app/dashboard/cashbox/service/payment-methods-service";
import { PaymentMethodResponse } from "@/app/dashboard/cashbox/types/payment-method-response";
import { Loader2 } from "lucide-react";

type Props = {
  cashboxId: number;
  movementType: CashboxMovementType;
  onSuccess?: () => void;
};

export const CashboxMovementForm: React.FC<Props> = ({
  cashboxId,
  movementType,
  onSuccess,
}) => {
  const form = useForm<CashboxMovementRequest>({
    resolver: zodResolver(CashboxMovementRequestSchema),
    defaultValues: {
      cashboxId,
      type: movementType,
      reason: CashboxMovementReason.OTHER,
      paymentMethodId: 0,
      amount: 0,
      description: "",
      documentReference: "",
      operationNumber: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    form.setValue("type", movementType);
  }, [movementType, form]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const data = await paymentMethodService.getAllActive();
        setPaymentMethods(data);
      } catch {
        toast.error("Error al cargar métodos de pago");
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchMethods();
  }, []);

  const onSubmit = async (data: CashboxMovementRequest) => {
    try {
      await CashboxMovementService.registerMovement(data);
      toast.success(CashboxMovementTypeLabels[data.type] + " registrado correctamente");
      form.reset({ ...form.getValues(), type: movementType });
      onSuccess?.();
    } catch {
      toast.error("Error al registrar " + CashboxMovementTypeLabels[data.type]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelSelect
                  id="reason"
                  label="Motivo"
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as CashboxMovementReason)
                  }
                  options={Object.entries(CashboxMovementReasonLabels).map(
                    ([value, label]) => ({
                      value,
                      label,
                    })
                  )}
                />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethodId"
          render={({ field }) => (
            <FormItem className="relative">
              <FormControl>
                <FloatingLabelSelect
                  id="paymentMethodId"
                  label="Método de pago"
                  value={field.value?.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  options={paymentMethods.map((pm) => ({
                    value: String(pm.id),
                    label: pm.name,
                  }))}
                  placeholder="Selecciona método"
                  disabled={loadingMethods}
                />
              </FormControl>
              <FormMessage className="ml-2" />
              {loadingMethods && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2 z-10">
                  <Loader2 className="animate-spin w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput
                  {...field}
                  id="amount"
                  type="number"
                  label="Monto"
                  onChange={(value) => field.onChange(parseFloat(value) || "")}
                />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput {...field} id="description" label="Descripción" />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="documentReference"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput
                  {...field}
                  id="documentReference"
                  label="Referencia de documento"
                />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="operationNumber"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput {...field} id="operationNumber" label="N° de operación" />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput {...field} id="notes" label="Notas" />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <div className="flex justify-center">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Registrar movimiento
          </Button>
        </div>
      </form>
    </Form>
  );
};
