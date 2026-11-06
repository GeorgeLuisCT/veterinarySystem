"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
} from "../_types/supplier-request";
import SupplierService from "../_service/supplier-service";
import { mapToCreateRequest, mapToUpdateRequest } from "../_helpers/supplier-mapper";
import { useSupplierContext } from "../_context/supplier-context";
import { SupplierType, SupplierTypeLabels } from "../_enums/supplier-type";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { ZodTypeAny } from "zod";

interface SupplierFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  supplierId?: number;
}

const defaultFormValues: SupplierRequest = {
  name: "",
  ruc: "",
  address: "",
  website: "",
  contactPhone: "",
  email: "",
  supplierType: SupplierType.NATURAL,
  bankAccountNumber: "",
  bankName: "",
};

export function SupplierForm({ open, setOpen, supplierId }: SupplierFormProps) {
  const [loading, setLoading] = React.useState(true);
  const { addSupplier, updateSupplier } = useSupplierContext();

  const schema: ZodTypeAny = supplierId ? supplierUpdateSchema : supplierCreateSchema;

  const form = useForm<SupplierRequest>({
    resolver: zodResolver(schema),
    defaultValues: defaultFormValues,
  });

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
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

    if (open) {
      if (!supplierId) {
        form.reset(defaultFormValues);
        setLoading(false);
      } else {
        fetchData();
      }
    }
  }, [supplierId, form, setOpen, open]);

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
      setOpen(false);
    } catch (error: unknown) {
      toast.error(getAaxiosErrorMessage(error) || "Error al guardar el proveedor");
      console.error("Error al guardar proveedor:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(96vw,1000px)] max-h-[90vh] overflow-y-auto rounded-lg sm:max-w-4xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">
            {supplierId ? "Editar Proveedor" : "Registrar Proveedor"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Completa los campos requeridos para registrar o actualizar un proveedor.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <fieldset className="rounded-lg border p-4">
                <legend className="px-1 text-sm font-semibold">Información General</legend>
                <div className="grid gap-4 sm:grid-cols-2">
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
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput
                            {...field}
                            id="contactPhone"
                            label="Teléfono de Contacto"
                          />
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
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                </div>
              </fieldset>

              <fieldset className="rounded-lg border p-4">
                <legend className="px-1 text-sm font-semibold">Información Bancaria y Fiscal</legend>
                <div className="grid gap-4 sm:grid-cols-2">
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
                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput
                            {...field}
                            id="bankAccountNumber"
                            label="Cuenta Bancaria"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </fieldset>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Guardando..."
                    : supplierId
                    ? "Guardar"
                    : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}