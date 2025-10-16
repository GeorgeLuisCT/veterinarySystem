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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { SaleProductRequest, saleProductRequestSchema } from "../types/sale-product-request";
import { AnimalQuickSearchResponse } from "@/app/dashboard/patients/animals/types/animal-quick-search-response";
import { toLocalSaleProduct } from "../helpers/sale-vet-product-mapper";
import { ProductResponse } from "../../inventory/products/types/product-response";
import { useSales } from "../context/sales-context-type";
import ProductService from "../../inventory/products/service/product-service";
import { getMainUnitLabelText, getSaleLabelText } from "../../inventory/products/utils/product-sale-labels";
import { getProductPresentationTypeLabelPlural } from "../../inventory/products/enums/product-presentation-type";
import { getProductUnitTypeLabel } from "../../inventory/products/enums/product-unit-type";
import { calculateSubtotalAndPrice } from "../util/calculate-subtotal-and-price";
import { ProductSaleModeResponse } from "../../inventory/products/types/product-sale-mode-response";

interface SaleProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  animalOptions?: AnimalQuickSearchResponse[];
  uid?: string;
  onClearSearch?: () => void;
}

export function SaleProductForm({ open, onOpenChange, productId, animalOptions, uid, onClearSearch }: SaleProductFormProps) {
  const { addSaleProduct, updateSaleProduct, sales, activeSaleId } = useSales();

  const [loading, setLoading] = React.useState(true);
  const [productData, setProductData] = React.useState<ProductResponse | null>(null);

  const currentProduct = React.useMemo(() => {
    if (!uid) return null;
    return sales[activeSaleId]?.saleProducts?.find((p) => p.uid === uid) ?? null;
  }, [uid, activeSaleId, sales]);

  const [unitTypeOptions, setUnitTypeOptions] = React.useState<
    { value: string; label: string; data: ProductSaleModeResponse | "mainUnit" }[]
  >([]);

  const form = useForm<SaleProductRequest>({
    resolver: zodResolver(saleProductRequestSchema),
    defaultValues: {
      productId: 0,
      unitType: "UNIT",
      quantityEquivalent: 1,
      price: 0,
      discount: 0,
      subtotal: 0,
      animalId: undefined,
      applied: true,
    },
  });

  React.useEffect(() => {
    const fetchProduct = async () => {
      if (!open || !productId) return;

      setLoading(true);
      try {
        const product = await ProductService.getProduct(productId);
        setProductData(product);

        const initialUnitType = currentProduct?.unitType ?? `main-${product.unitType}`;
        const initialPrice = currentProduct?.price ?? product.standardPrice;
        const initialQuantity = currentProduct?.quantityEquivalent ?? 1;
        const initialSubtotal = currentProduct
          ? currentProduct.price * currentProduct.quantityEquivalent - (currentProduct.discount ?? 0)
          : product.standardPrice;

        const unitOptions = generateUnitOptions(product);
        setUnitTypeOptions(unitOptions);

        form.reset({
          productId: product.id,
          unitType: initialUnitType,
          quantityEquivalent: initialQuantity,
          price: initialPrice,
          discount: currentProduct?.discount ?? 0,
          subtotal: initialSubtotal,
          animalId: currentProduct?.animal?.id ?? undefined,
          applied: currentProduct?.applied ?? true,
        });

        // Autoasignar primer animal si no hay uno ya asignado
        if (!currentProduct?.animal?.id && animalOptions && animalOptions.length > 0) {
          form.setValue("animalId", animalOptions[0].id);
        }

        // Autoasignar primer modo de venta si no hay uno ya asignado
        if (!currentProduct?.unitType && unitOptions.length > 0) {
          form.setValue("unitType", unitOptions[0].value);
          const selected = unitOptions[0];

          if (selected.data === "mainUnit") {
            form.setValue("quantityEquivalent", 1);
            form.setValue("price", product.standardPrice);
            form.setValue("subtotal", product.standardPrice);
          } else {
            const mode = selected.data as ProductSaleModeResponse;
            form.setValue("quantityEquivalent", mode.quantityEquivalent);
            form.setValue("price", mode.price);
            form.setValue("subtotal", mode.quantityEquivalent * mode.price);
          }
        }

      } catch (error) {
        console.error("Error al obtener el producto", error);
        toast.error("Error al cargar los datos del producto.");
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [open, productId, form, onOpenChange]);


  const onSubmit = async (data: SaleProductRequest) => {
    if (!productData) {
      toast.error("No se pudo cargar el producto.");
      return;
    }

    const localSale = toLocalSaleProduct(data, productData, animalOptions ?? [], uid);

    if (uid) {
      updateSaleProduct(localSale);
      toast.success("Producto actualizado");
    } else {
      addSaleProduct(localSale);
      toast.success("Producto agregado");
    }

    onClearSearch?.();
    onOpenChange(false);
  };



  function generateUnitOptions(product: ProductResponse) {
    const mainUnitOption = {
      value: `${product.unitType}`,
      label: getMainUnitLabelText(product.unitType, product.contentTotal, product.standardPrice, product.presentation),
      data: "mainUnit" as const,
    };

    const saleModeOptions = product.saleModes.map((mode) => ({
      value: `${mode.unitType}`,
      label: getSaleLabelText(mode.unitType, mode.quantityEquivalent, mode.price, product.unitType, product.presentation),
      data: mode,
    }));

    return [mainUnitOption, ...saleModeOptions];
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Venta de {productData?.name ?? "Producto"}</DialogTitle>
          <DialogDescription>
            Agrega datos adicionales para la venta del producto.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {(animalOptions && animalOptions?.length > 0) && <FormField
                  control={form.control}
                  name="animalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="animalId"
                          label="Para:"
                          value={String(field.value ?? "")}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          options={animalOptions.map((animal) => ({ value: String(animal.id), label: animal.name }))}
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />}

                <FormField
                  control={form.control}
                  name="unitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelSelect
                          id="unitType"
                          label="Modo de venta"
                          value={field.value}
                          onValueChange={(newValue) => {
                            field.onChange(newValue);

                            const selected = unitTypeOptions.find(opt => opt.value === newValue);
                            if (!selected) return;

                            if (selected.data === "mainUnit") {
                              const price = productData?.standardPrice ?? 0;
                              form.setValue("quantityEquivalent", 1);
                              form.setValue("price", price);
                              form.setValue("subtotal", price);
                            } else {
                              const mode = selected.data as ProductSaleModeResponse;
                              const price = mode.price;
                              const quantity = mode.quantityEquivalent;
                              form.setValue("quantityEquivalent", quantity);
                              form.setValue("price", price);
                              form.setValue("subtotal", price * quantity);
                            }
                          }}
                          options={unitTypeOptions}
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantityEquivalent"
                  render={({ field }) => {
                    const selectedOption = unitTypeOptions.find(opt => opt.value === form.watch("unitType"));

                    let quantityLabel = "Cantidad";
                    if (selectedOption) {
                      if (selectedOption.data === "mainUnit") {
                        const label =
                          productData?.presentation !== undefined
                            ? getProductPresentationTypeLabelPlural(productData.presentation).toLocaleLowerCase()
                            : "unidades";

                        quantityLabel = `Cantidad de ${label}`;
                      } else {
                        const mode = selectedOption.data as ProductSaleModeResponse;
                        quantityLabel = `Cantidad de ${getProductUnitTypeLabel(mode.unitType).toLocaleLowerCase()}s`;
                      }
                    }
                    return (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput
                            {...field}
                            id="quantityEquivalent"
                            label={quantityLabel}
                            type="number"
                            onChange={(value) => {
                              const quantity = parseFloat(value) || 0;
                              const price = form.getValues("price") || 0;
                              const discount = form.getValues("discount") || 0;
                              const { newSubtotal } = calculateSubtotalAndPrice({ price, discount, quantity, subtotal: 0 });

                              form.setValue("quantityEquivalent", quantity);
                              form.setValue("subtotal", newSubtotal || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="ml-2" />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          {...field}
                          id="price"
                          label="Precio de venta"
                          type="number"
                          onChange={(value) => {
                            const price = parseFloat(value) || 0;
                            const quantity = form.getValues("quantityEquivalent") || 0;
                            const discount = form.getValues("discount") || 0;
                            const { newSubtotal } = calculateSubtotalAndPrice({ price, discount, quantity, subtotal: 0 });

                            form.setValue("price", price);
                            form.setValue("subtotal", newSubtotal || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          {...field}
                          id="discount"
                          label="Descuento"
                          type="number"
                          onChange={(value) => {
                            const discount = parseFloat(value) || 0;
                            const quantity = form.getValues("quantityEquivalent") || 0;
                            const price = form.getValues("price") || 0;
                            const { newSubtotal } = calculateSubtotalAndPrice({ price, discount, quantity, subtotal: 0 });

                            form.setValue("discount", discount);
                            form.setValue("subtotal", newSubtotal || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          {...field}
                          id="subtotal"
                          label="Total"
                          type="number"
                          onChange={(value) => {
                            const subtotal = parseFloat(value) || 0;
                            const quantity = form.getValues("quantityEquivalent") || 0;
                            const discount = form.getValues("discount") || 0;
                            const { newPrice } = calculateSubtotalAndPrice({ price: 0, discount, quantity, subtotal });

                            form.setValue("subtotal", subtotal);
                            form.setValue("price", newPrice || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-center">
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                    {form.formState.isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                    {uid ? "Actualizar" : "Agregar"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}