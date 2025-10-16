"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AddSurgicalReportMaterialRequest,
  addSurgicalReportMaterialSchema,
} from "../../types/surgical-report-request";
import ProductService from "@/app/dashboard/inventory/products/service/product-service";
import SurgicalReportService from "../../service/surgical-report-service";
import { SurgicalReportDetailResponse } from "../../types/surgical-report-response";
import { useUser } from "@/context/user-context";

type Option = {
  value: string;
  label: string;
};

interface AddMaterialModalProps {
  reportId: number;
  open: boolean;
  onClose: () => void;
  onAdded: (detail: SurgicalReportDetailResponse) => void;
}

export function AddMaterialModal({ reportId, open, onClose, onAdded }: AddMaterialModalProps) {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const [productOptions, setProductOptions] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [useCatalogProduct, setUseCatalogProduct] = useState(true);

  const form = useForm<AddSurgicalReportMaterialRequest>({
    resolver: zodResolver(addSurgicalReportMaterialSchema),
    defaultValues: {
      productId: undefined,
      unregisteredProductName: null,
      quantity: 1,
    },
    mode: "onChange",
  });

  useEffect(() => {
    // Reset mutually exclusive fields based on selection mode
    if (useCatalogProduct) {
      form.setValue("unregisteredProductName", null, { shouldValidate: true, shouldDirty: true });
    } else {
      form.setValue("productId", null, { shouldValidate: true, shouldDirty: true });
    }
  }, [useCatalogProduct, form]);

  const handleSearchProducts = async (query: string) => {
    if (query.length < 2) {
      setProductOptions([]);
      return;
    }
    try {
      const results = await ProductService.searchProducts(query, userInfo?.selectedBranch.id);
      setProductOptions(
        results.map((product) => ({
          value: String(product.id),
          label: product.name,
        }))
      );
    } catch (error) {
      console.error("Error searching products:", error);
      setProductOptions([]);
    }
  };

  const onSubmit = async (values: AddSurgicalReportMaterialRequest) => {
    setSubmitting(true);
    try {
      const response = await SurgicalReportService.addMaterial(reportId, values);
      onAdded(response);
      toast({
        title: "Material agregado",
        description: "El material se registró correctamente en el reporte.",
      });
      onClose();
    } catch (error) {
      console.error("Error adding material:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el material. Intenta nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar material quirúrgico</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={useCatalogProduct ? "default" : "outline"}
            size="sm"
            onClick={() => setUseCatalogProduct(true)}
          >
            Catálogo
          </Button>
          <Button
            type="button"
            variant={!useCatalogProduct ? "default" : "outline"}
            size="sm"
            onClick={() => setUseCatalogProduct(false)}
          >
            No registrado
          </Button>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            {useCatalogProduct ? (
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="material-product"
                        label="Producto"
                        placeholder="Buscar producto..."
                        options={productOptions}
                        onSearch={handleSearchProducts}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="unregisteredProductName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="custom-material-name"
                        label="Nombre del material"
                        value={field.value ?? ""}
                        onChange={(value) => field.onChange(value === "" ? null : value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      id="material-quantity"
                      label="Cantidad"
                      type="number"
                      min="1"
                      value={field.value ?? ""}
                      onChange={(value) =>
                        field.onChange(value === "" ? undefined : Number(value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !form.formState.isValid}>
                {submitting ? "Guardando..." : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
