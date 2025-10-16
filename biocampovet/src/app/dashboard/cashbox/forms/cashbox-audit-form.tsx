"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import CashBoxAuditService from "../service/cashbox-audit-service";
import { toast } from "sonner";
import { CashBoxAuditRequest, CashBoxAuditRequestSchema } from "../types/cash-box-audit-request";
import { paymentMethodService } from "../service/payment-methods-service";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getAaxiosErrorMessage } from "@/helpers/error";

type Props = {
  cashboxId: number;
  onSuccess?: () => void;
};

export const CashboxAuditForm: React.FC<Props> = ({ cashboxId, onSuccess }) => {
  const form = useForm<CashBoxAuditRequest>({
    resolver: zodResolver(CashBoxAuditRequestSchema),
    defaultValues: {
      cashBoxId: cashboxId,
      isFinal: false,
      observations: "",
      paymentMethodAudits: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "paymentMethodAudits",
  });

  const [paymentMethods, setPaymentMethods] = useState<{ value: string; label: string }[]>([]);

  const fetchPaymentMethods = async () => {
    try {
      const list = await paymentMethodService.getAll();
      setPaymentMethods(list.map((m) => ({ value: String(m.id), label: m.name })));
    } catch (error) {
      console.error("Error al cargar métodos de pago", error);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [cashboxId]);

  const onSubmit = async (data: CashBoxAuditRequest) => {
    try {
      await CashBoxAuditService.registerAudit(data);
      toast.success("Corte de caja registrada correctamente");
      form.reset();
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(getAaxiosErrorMessage(error) || "Error al registrar el corte de caja");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput {...field} id="observations" label="Observaciones" />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold">Metodos de pago</label>
            <Button
              type="button"
              onClick={() => append({ paymentMethodId: 0, expectedAmount: 0, countedAmount: 0 })}
              className="flex items-center gap-1 rounded-xl cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="grid grid-cols-2 gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`paymentMethodAudits.${index}.paymentMethodId`}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormControl>
                        <FloatingLabelSelect
                          id={`paymentMethodId-${index}`}
                          label="Método de pago"
                          value={String(field.value ?? "")}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          options={paymentMethods}
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`paymentMethodAudits.${index}.expectedAmount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          {...field}
                          id={`expectedAmount-${index}`}
                          type="number"
                          label="Monto esperado"
                          onChange={(value) => field.onChange(parseFloat(value) || "")}
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`paymentMethodAudits.${index}.countedAmount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          {...field}
                          id={`countedAmount-${index}`}
                          type="number"
                          label="Monto contado"
                          onChange={(value) => field.onChange(parseFloat(value) || "")}
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="ghost"
                  className="hover:bg-red-100 cursor-pointer"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Registrar Corte
          </Button>
        </div>
      </form>
    </Form>
  );
};
