"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";

import {
  supplierCreateSchema,
  supplierUpdateSchema,
  type SupplierRequest,
} from "../types/supplier-request";
import SupplierService from "../service/supplier-service";
import { mapToCreateRequest, mapToUpdateRequest } from "../helpers/supplier-mapper";
import { useSupplierContext } from "../context/supplier-context";
import { SupplierType, SupplierTypeLabels } from "../enums/supplier-type";
import { getAaxiosErrorMessage } from "@/helpers/error";

interface SupplierFormProps {
  setOpen: (open: boolean) => void;
  supplierId?: number;
  onSave?: () => void;
}

export function SupplierForm({ setOpen, supplierId, onSave }: SupplierFormProps) {
  const [loading, setLoading] = React.useState(true);
  const { addSupplier, updateSupplier } = useSupplierContext();

  const schema = supplierId ? supplierUpdateSchema : supplierCreateSchema;

  const form = useForm<SupplierRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      ruc: "",
      address: "",
      website: "",
      contactPhone: "",
      email: "",
      supplierType: SupplierType.NATURAL,
      bankAccountNumber: "",
      bankName: "",
    },
  });

  React.useEffect(() => {
    async function fetchData() {
      if (supplierId) {
        try {
          const supplier = await SupplierService.getSupplier(supplierId);
          form.reset(supplier);
        } catch (error: unknown) {
          toast.error(getAaxiosErrorMessage(error) || "Error al cargar el proveedor");
          setOpen(false);
        }
      }
      setLoading(false);
    }

    fetchData();
  }, [supplierId, form, setOpen]);

  const onSubmit = async (data: SupplierRequest) => {
    try {
      if (supplierId) {
        const updated = await SupplierService.updateSupplier(mapToUpdateRequest(data, supplierId));
        toast.success("Proveedor actualizado correctamente");
        updateSupplier(updated);
      } else {
        const created = await SupplierService.createSupplier(mapToCreateRequest(data));
        toast.success("Proveedor registrado exitosamente");
        addSupplier(created);
      }

      if (onSave) onSave();
      form.reset();
      setOpen(false);
    } catch (error: unknown) {
      toast.error(getAaxiosErrorMessage(error) || "Error al guardar el proveedor");
      console.error("Error al guardar proveedor:", error);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-auto p-4">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput {...field} id="name" label="Nombre o Razón Social" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ruc"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput {...field} id="ruc" label="RUC" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput {...field} id="address" label="Dirección" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput {...field} id="website" label="Sitio Web" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput {...field} id="contactPhone" label="Teléfono de Contacto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput {...field} id="email" label="Correo Electrónico" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelSelect
                      id="supplierType"
                      label="Tipo de Proveedor"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={Object.values(SupplierType).map((type) => ({
                        value: type,
                        label: SupplierTypeLabels[type],
                      }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput {...field} id="bankAccountNumber" label="Cuenta Bancaria" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput {...field} id="bankName" label="Banco" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-center">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                {form.formState.isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                {supplierId ? "Guardar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
