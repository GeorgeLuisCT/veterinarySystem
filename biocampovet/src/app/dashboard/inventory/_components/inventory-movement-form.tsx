"use client";

import { FieldError, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

import AddMovementProductForm from "./add-movement-product-form";
import InventoryProductTable from "./inventory-product-table";
import {
  InventoryMovementRequest,
  InventoryMovementSchema,
} from "../(pages)/movements/types/inventory-movement-request";
import {
  InventoryMovementType,
  InventoryMovementTypeLabels,
} from "../_enums/inventory-movement-type";
import { InventoryMovementProductLocal } from "../(pages)/movements/types/inventory-movement-product-request";
import { toRequestInventoryMovementProduct } from "../_helpers/inventory-movement-product-mapper";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import SupplierService from "../_service/supplier-service";
import { SupplierQuickSearchResponse } from "../../suppliers/types/supplier-quick-search-response";
import InventoryMovementService from "../(pages)/movements/service/inventory-movement-service";
import { toast } from "sonner";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { ProductQuickSearchResponse } from "@/app/dashboard/inventory/products/types/product-quick-search-response";
import { getProductPresentationTypeLabel } from "../_enums/product-presentation-type";
import { sanitizeProductsForMovementType, warnIfIncompleteProductsForPurchase } from "../util/validate-movement-product";
import { lowerCase } from "lodash";

type InventoryMovementFormProps = {
  allowedTypes: InventoryMovementType[];
  label: string;
};


export default function InventoryMovementForm({ allowedTypes, label }: InventoryMovementFormProps) {
  const [localProducts, setLocalProducts] = useState<InventoryMovementProductLocal[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ value: string; label: string }[]>([]);

  const [productsOptions, setProductsOptions] = useState<ProductQuickSearchResponse[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductOption, setSelectedProductOption] = useState<ProductQuickSearchResponse | null>(null);

  const [productToEdit, setProductToEdit] = useState<InventoryMovementProductLocal | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);


  const [openPanel, setOpenPanel] = useState(false);

  const form = useForm<InventoryMovementRequest>({
    resolver: zodResolver(InventoryMovementSchema),
    defaultValues: {
      products: [],
    },
  });

  useEffect(() => {
    const currentType = form.getValues("type");

    if (!currentType && allowedTypes.length > 0) {
      form.setValue("type", allowedTypes[0]);
    }
  }, [allowedTypes, form]);

  useEffect(() => {
    BranchService.getBranchesByLoggedEmployee()
      .then(setBranches)
      .catch((err) => console.error("Error al cargar sucursales:", err));
  }, []);

  const handleSearchSuppliers = async (query: string) => {
    try {
      const results = await SupplierService.searchSuppliers(query);
      const options = results.map((s: SupplierQuickSearchResponse) => ({
        value: s.id.toString(),
        label: s.name,
      }));
      setSupplierOptions(options);
    } catch (error) {
      console.error("Error buscando proveedores:", error);
    }
  };

  const handleSearchProduct = async (query: string) => {
    try {
      const results = await ProductService.searchProducts(query, form.watch("sourceBranchId"));
      setProductsOptions(results);
    } catch (error) {
      console.error("Error buscando productos:", error);
    }
  };

  const onSubmit = async (data: InventoryMovementRequest) => {
    try {
      InventoryMovementService.createMovement(data);

      toast("Movimiento registrado exitosamente.");

      form.reset({
        type: undefined,
        sourceBranchId: undefined,
        targetBranchId: undefined,
        supplierId: undefined,
        description: "",
        products: [],
      });
      setLocalProducts([]);
      setSelectedProductId(null);
      setSelectedProductOption(null);

      setLocalProducts([]);
    } catch (error: unknown) {
      console.error("Error al crear movimiento:", error);
      toast("No se pudo registrar el movimiento.");
    }
  };

  const movementType = form.watch("type");

  const requiresSupplier = movementType === InventoryMovementType.PURCHASE || movementType === InventoryMovementType.SUPPLIER_RETURN;
  const isIncoming = movementType === InventoryMovementType.PURCHASE || movementType === InventoryMovementType.POSITIVE_ADJUSTMENT || movementType === InventoryMovementType.TRANSFER_SENT || movementType === InventoryMovementType.TRANSFER_RECEIVED;
  const isOutgoing = movementType === InventoryMovementType.SUPPLIER_RETURN || movementType === InventoryMovementType.NEGATIVE_ADJUSTMENT || movementType === InventoryMovementType.TRANSFER_SENT || movementType === InventoryMovementType.TRANSFER_RECEIVED;

  useEffect(() => {
    if (!requiresSupplier) {
      form.setValue("supplierId", undefined);
    }
    if (!isOutgoing) {
      form.setValue("sourceBranchId", undefined);
    }
    if (!isIncoming) {
      form.setValue("targetBranchId", undefined);
    }
  }, [movementType]);

  useEffect(() => {
    if (localProducts.length === 0) return;

    const cleanedProducts = sanitizeProductsForMovementType(localProducts, movementType);

    setLocalProducts(cleanedProducts);
    form.setValue(
      "products",
      cleanedProducts.map(toRequestInventoryMovementProduct)
    );

    warnIfIncompleteProductsForPurchase(cleanedProducts, movementType);
  }, [movementType]);


  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            onSubmit,
            (errors) => {
              if (Array.isArray(errors.products)) {
                const hasProductErrors = errors.products.some((productError) => {
                  if (!productError) return false;

                  return Object.values(productError).some((fieldError) => {
                    const typedError = fieldError as FieldError;
                    return !!typedError?.message;
                  });
                });

                if (hasProductErrors) {
                  toast.error("Hay campos en uno o más productos que faltan completar.");
                }
              }
            }
          )}

          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {allowedTypes.length > 1 ? (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="type"
                        label={`tipo de ${lowerCase(label)}`}
                        value={field.value ?? allowedTypes[0]}
                        onValueChange={(value) => field.onChange(value as InventoryMovementType)}
                        options={allowedTypes.map((type) => ({
                          value: type,
                          label: InventoryMovementTypeLabels[type],
                        }))}
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
            ) : (
              <input type="hidden" value={allowedTypes[0]} {...form.register("type")} />
            )}

            {requiresSupplier && (
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="supplierId"
                        label="Proveedor"
                        value={field.value?.toString() ?? ""}
                        onValueChange={(value) => {
                          const parsed = parseInt(value);
                          field.onChange(isNaN(parsed) ? undefined : parsed);
                        }}
                        options={supplierOptions}
                        onSearch={handleSearchSuppliers}
                        placeholder="Buscar proveedor..."
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
            )}

            {isOutgoing && (
              <FormField
                control={form.control}
                name="sourceBranchId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="sourceBranchId"
                        label="Sucursal Origen"
                        value={field.value?.toString() ?? ""}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        options={branches.map((branch) => ({
                          value: branch.id.toString(),
                          label: branch.name,
                        }))}
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
            )}

            {isIncoming && (
              <FormField
                control={form.control}
                name="targetBranchId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="targetBranchId"
                        label="Sucursal Destino"
                        value={field.value?.toString() ?? ""}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        options={branches.map((branch) => ({
                          value: branch.id.toString(),
                          label: branch.name,
                        }))}
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="description"
                      label="Descripción"
                      type="text"
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

          </div>

          <FloatingLabelSelect
            className="w-full md:max-w-md"
            id="productSelector"
            label="Buscar y seleccionar producto"
            value=""
            onValueChange={(value) => {
              const selected = productsOptions.find((p) => p.id === parseInt(value));
              if (selected) setSelectedProductOption(selected);

              setSelectedProductId(parseInt(value));
              setOpenPanel(true);
            }}
            onSearch={handleSearchProduct}
            options={productsOptions.map((p) => ({
              value: String(p.id),
              label: p.name + " en " + getProductPresentationTypeLabel(p.presentation),
            }))}
            placeholder="Buscar producto..."
          />

          <InventoryProductTable
            products={localProducts}
            movementType={form.watch("type")}
            onRemove={(index) => {
              const updated = [...localProducts];
              updated.splice(index, 1);
              setLocalProducts(updated);
              form.setValue(
                "products",
                updated.map(toRequestInventoryMovementProduct)
              );
            }}
            onEdit={(index) => {
              setProductToEdit(localProducts[index]);
              setEditIndex(index);
              setOpenPanel(true);
            }}
          />

          <div className="flex justify-center pt-2">
            <Button type="submit">{`Guardar ${label}`}</Button>
          </div>
        </form>
      </Form>

      <Dialog open={openPanel} onOpenChange={(open) => {
        setOpenPanel(open);
        if (!open) {
          setSelectedProductOption(null);
          setProductToEdit(null);
          setEditIndex(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProductOption
                ? `${selectedProductOption.name} en ${getProductPresentationTypeLabel(selectedProductOption.presentation)}`
                : "Añadir Producto"}
            </DialogTitle>
            <DialogDescription>
              {selectedProductOption
                ? "Completa los datos del producto seleccionado."
                : "Selecciona un producto para continuar."}
            </DialogDescription>
          </DialogHeader>

          <AddMovementProductForm
            selectedProductId={selectedProductId}
            movementType={form.watch("type")}
            selectedBranchId={form.watch("sourceBranchId")}
            productToEdit={productToEdit ?? undefined}
            editIndex={editIndex ?? undefined}
            onAdd={(productLocal) => {
              const updated = [...localProducts, productLocal];
              setLocalProducts(updated);
              form.setValue(
                "products",
                updated.map(toRequestInventoryMovementProduct)
              );
              setOpenPanel(false);
              setSelectedProductOption(null);
            }}
            onUpdate={(updatedProduct, index) => {
              const updated = [...localProducts];
              updated[index] = updatedProduct;
              setLocalProducts(updated);
              form.setValue(
                "products",
                updated.map(toRequestInventoryMovementProduct)
              );
              setOpenPanel(false);
              setProductToEdit(null);
              setEditIndex(null);
              setSelectedProductOption(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
