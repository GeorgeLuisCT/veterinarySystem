"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import CustomerService from "../service/customer-service";
import { useCustomerContext } from "../context/customer-context";
import { mapToCreateRequest, mapToUpdateRequest } from "../helpers/customer-request-mapper";
import { ZodTypeAny } from "zod";
import { DocumentTypeResponse } from "../types/document-type-response";
import {
  customerCreateSchema,
  CustomerRequest,
  customerUpdateSchema,
} from "../types/customer-request";
import DocumentTypeService from "../service/DocumentTypeService";
import { CustomerSummaryResponse } from "../types/customer-summary-response";
import { getAaxiosErrorMessage } from "@/helpers/error";

interface CustomerFormProps {
  setOpen: (open: boolean) => void;
  customerId?: number;
  customerContext?: ReturnType<typeof useCustomerContext>;
  onSuccess?: (customer: CustomerSummaryResponse) => void;
}

export function CustomerForm({
  setOpen,
  customerId,
  customerContext,
  onSuccess,
}: CustomerFormProps) {
  const [documentTypes, setDocumentTypes] = React.useState<DocumentTypeResponse[]>([]);
  const [loading, setLoading] = React.useState(true);

  const schema: ZodTypeAny = customerId ? customerUpdateSchema : customerCreateSchema;

  const form = useForm<CustomerRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      documentTypeId: 0,
      documentNumber: "",
      phoneNumber: "",
      email: "",
      address: "",
    },
  });

  React.useEffect(() => {
    async function fetchData() {
      try {
        const documentTypesData = await DocumentTypeService.getDocumentTypes();
        setDocumentTypes(documentTypesData);

        if (customerId) {
          const customer = await CustomerService.getCustomer(customerId);

          form.reset({
            name: customer.name,
            documentTypeId: customer.documentType.id,
            documentNumber: customer.documentNumber,
            phoneNumber: customer.phoneNumber ?? "",
            email: customer.email ?? "",
            address: customer.address ?? "",
            id: customer.id,
          });
        }
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al procesar el cliente";
        toast.error(message);
        console.error("Error al cargar datos", error);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [customerId, form, setOpen]);

  const onSubmit = async (data: CustomerRequest) => {
    try {
      if (customerId) {
        const updatedCustomer = await CustomerService.updateCustomer(
          mapToUpdateRequest(data, customerId)
        );
        toast.success("Cliente actualizado correctamente");
        customerContext?.updateCustomer(updatedCustomer);
        onSuccess?.(updatedCustomer);
      } else {
        const createdCustomer = await CustomerService.createCustomer(mapToCreateRequest(data));
        toast.success("Cliente registrado exitosamente!");
        customerContext?.addCustomer(createdCustomer);
        onSuccess?.(createdCustomer);
      }
      form.reset();
      setOpen(false);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al procesar el cliente";
      toast.error(message);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-auto p-4">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="documentTypeId"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelSelect
                      id="documentTypeId"
                      label="Tipo de documento"
                      value={String(field.value ?? "")}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      options={documentTypes.map((doc) => ({
                        value: String(doc.id),
                        label: doc.name,
                      }))}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentNumber"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="documentNumber"
                      label="Número de documento"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="name"
                      label="Nombre completo"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="phoneNumber"
                      label="Teléfono"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="email"
                      label="Correo electrónico"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="address"
                      label="Dirección"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <div className="flex justify-center">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                {form.formState.isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                {customerId ? "Guardar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
