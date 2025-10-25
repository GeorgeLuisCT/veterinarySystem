"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { getProductUnitTypeLabel } from "../_enums/product-unit-type";
import { getAllowedVariants } from "../_utils/product-unit-type-validator";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { ProductResponse } from "@/app/dashboard/inventory/_types/product-response";
import { InventoryMovementProductRequest, InventoryMovementProductLocal, InventoryMovementProductSchema } from "../(pages)/movements/types/inventory-movement-product-request";
import { InventoryMovementType } from "../_enums/inventory-movement-type";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";

interface Props {
  onAdd: (product: InventoryMovementProductLocal) => void;
  onUpdate?: (product: InventoryMovementProductLocal, index: number) => void;
  selectedBranchId?: number;
  selectedProductId?: number | null;
  productToEdit?: InventoryMovementProductLocal;
  editIndex?: number;
  movementType: InventoryMovementType;
}

export default function AddMovementProductForm({
  onAdd,
  onUpdate,
  selectedProductId,
  productToEdit,
  editIndex,
  movementType,
}: Props) {

  const form = useForm<InventoryMovementProductRequest>({
    resolver: zodResolver(InventoryMovementProductSchema),
    defaultValues: {
      quantity: 1,
    },
  });


  const isEditMode = productToEdit && typeof editIndex === "number";

  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  const isPucharse = movementType === InventoryMovementType.PURCHASE;

  useEffect(() => {
    if (!isPucharse) {
      form.setValue("unitCost", undefined);
      form.setValue("expirationDate", undefined);
    }

  }, [movementType]);


  useEffect(() => {
    if (isEditMode && productToEdit) {
      setSelectedProduct(productToEdit.product);
      form.setValue("productId", productToEdit.product.id);
      form.setValue("productUnitType", productToEdit.productUnitType);
      form.setValue("quantity", productToEdit.quantity);
      form.setValue("unitCost", productToEdit.unitCost);
      form.setValue("batchNumber", productToEdit.batchNumber);
      form.setValue("expirationDate", productToEdit.expirationDate ?? undefined);
    }
  }, [productToEdit]);


  useEffect(() => {
    if (!selectedProductId || isEditMode) return;
    loadProductById(selectedProductId);
  }, [selectedProductId]);

  const loadProductById = async (id: number) => {
    setIsLoadingProduct(true);
    try {
      const product = await ProductService.getProduct(id);
      setSelectedProduct(product);
      form.setValue("productId", product.id, { shouldValidate: true });
      const defaultUnit = getAllowedVariants(product.unitType)[0];
      form.setValue("productUnitType", defaultUnit, { shouldValidate: true });
    } catch (error) {
      console.error("Error al cargar producto:", error);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const onSubmit = (data: InventoryMovementProductRequest) => {
    if (!selectedProduct) return;

    const extraErrors = validateMovementProductExtra(data, movementType);
    if (Object.keys(extraErrors).length > 0) {
      for (const [field, message] of Object.entries(extraErrors)) {
        form.setError(field as keyof InventoryMovementProductRequest, { message });
      }
      return;
    }

    const productData: InventoryMovementProductLocal = {
      ...data,
      product: selectedProduct,
    };

    if (isEditMode && onUpdate) {
      onUpdate(productData, editIndex!);
    } else {
      onAdd(productData);
    }

    form.reset({
      quantity: 1,
      productUnitType: undefined,
      unitCost: undefined,
      batchNumber: undefined,
      expirationDate: undefined,
    });

    setSelectedProduct(null);
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">

        <FormField
          control={form.control}
          name="batchNumber"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput
                  {...field}
                  id="batchNumber"
                  label="Lote"
                  type="text"
                />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productUnitType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelSelect
                  id="productUnitType"
                  label="Unidad de Medida"
                  value={field.value ?? ""}
                  onValueChange={(value) => field.onChange(value)}
                  disabled={!selectedProduct}
                  options={
                    selectedProduct
                      ? getAllowedVariants(selectedProduct.unitType).map((unit) => ({
                        value: unit,
                        label: getProductUnitTypeLabel(unit),
                      }))
                      : []
                  }
                />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput
                  {...field}
                  id="quantity"
                  label="Cantidad"
                  type="number"
                  step="0.01"
                  onChange={(value) => field.onChange(parseFloat(value) || 0)}
                />
              </FormControl>
              <FormMessage className="ml-2" />
            </FormItem>
          )}
        />

        {isPucharse && (
          <FormField
            control={form.control}
            name="unitCost"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput
                    {...field}
                    id="unitCost"
                    label="Costo Unitario"
                    type="number"
                    step="0.01"
                    onChange={(value) => field.onChange(parseFloat(value) || 0)}
                  />
                </FormControl>
                <FormMessage className="ml-2" />
              </FormItem>
            )}
          />
        )}

        {isPucharse && (
          <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormControl>
                  <FloatingLabelDateInput
                    id="expirationDate"
                    label="Fecha de expiración"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={false}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage className="ml-2" />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-center pt-2">
          <Button type="submit" disabled={isLoadingProduct || !selectedProduct}>
            {isLoadingProduct && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEditMode ? "Guardar Cambios" : "Agregar Producto"}
          </Button>
        </div>
      </form>
    </Form >
  );
}
