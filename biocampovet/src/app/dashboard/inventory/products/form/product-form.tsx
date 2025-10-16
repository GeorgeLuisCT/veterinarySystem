"use client";
import * as React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ProductService from "../service/product-service";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { categoryService } from "../service/category-product-service";
import { ProductSaleModeForm } from "./product-sale-mode-form";
import { useProductContext } from "../context/product-context-type";
import { productCreateSchema, ProductRequest, productUpdateSchema } from "../types/product-request";
import { mapToCreateRequest, mapToUpdateRequest } from "../helpers/product-mapper";
import { ZodTypeAny } from "zod";
import { useUser } from "@/context/user-context";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelMultiSelect } from "@/components/floating-label-multi-select";
import {
  getProductPresentationTypeLabel,
  ProductPresentationType,
} from "../enums/product-presentation-type";
import { getAllowedUnitsByPresentation } from "../utils/product-presentation-type-validator";
import {
  getProductUnitTypeAbbreviation,
  getProductUnitTypeLabel,
  ProductUnitType,
} from "../enums/product-unit-type";
import { isCompatibleProductUnit } from "../utils/product-unit-type-validator";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { CategoryProductResponse } from "../types/category-product-response";

interface ProductFormProps {
  setOpen: (open: boolean) => void;
  productId?: number;
}

export function ProductForm({ setOpen, productId }: ProductFormProps) {
  const [branches, setBranches] = React.useState<BranchResponse[]>([]);
  const [categories, setCategories] = React.useState<CategoryProductResponse[]>([]);
  const [loading, setLoading] = React.useState(true);

  const { addProduct, updateProduct } = useProductContext();

  const { userInfo } = useUser();

  const schema: ZodTypeAny = productId ? productUpdateSchema : productCreateSchema;

  const form = useForm<ProductRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      minStock: 0,
      categoryId: 0,
      sku: "",
      presentation: ProductPresentationType.LOOSE,
      unitType: ProductUnitType.UNIT,
      standardPrice: 0,
      contentTotal: 1,
      saleModes: [],
      branchIds: [],
    },
  });

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [branchesData, categoriesData] = await Promise.all([
          BranchService.getBranches(),
          categoryService.getAll(),
        ]);
        setBranches(branchesData);
        setCategories(categoriesData);

        const selectedId = userInfo?.selectedBranch?.id ?? 0;
        form.setValue("branchIds", selectedId > 0 ? [selectedId] : branchesData.map((b) => b.id));

        if (productId) {
          const product = await ProductService.getProduct(productId);

          form.reset({
            name: product.name,
            description: product.description,
            minStock: product.minStock,
            categoryId: product.category.id,
            sku: product.sku,
            presentation: product.presentation,
            unitType: product.unitType,
            standardPrice: product.standardPrice,
            contentTotal: product.contentTotal,
            saleModes: product.saleModes,
            branchIds: product.branchStocks.map((stock) => stock.id) ?? [],
            id: product.id,
          });
        }
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al procesar el producto";
        toast.error(message);
        console.error("Error al cargar datos", error);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [productId, form, setOpen]);

  const handleSearchBranches = async (query: string) => {
    try {
      const results = await BranchService.getBranches(query);
      setBranches(results);
    } catch (error) {
      console.error("Error buscando sucursales:", error);
    }
  };

  const onSubmit = async (data: ProductRequest) => {
    try {
      if (productId) {
        const updatedProduct = await ProductService.updateProduct(
          mapToUpdateRequest(data, productId)
        );
        toast.success("Producto actualizado correctamente");
        updateProduct(updatedProduct);
      } else {
        const createdProduct = await ProductService.createProduct(mapToCreateRequest(data));
        toast.success("Producto registrado exitosamente!");

        const selectedId = userInfo?.selectedBranch?.id ?? 0;
        const branchIds = data.branchIds ?? [];

        const isSelectedIncluded = branchIds.includes(selectedId);
        const shouldAddProduct =
          (selectedId > 0 && isSelectedIncluded) || (branchIds.length > 0 && selectedId === 0);

        if (shouldAddProduct) {
          addProduct(createdProduct);
        } else if (selectedId > 0 && !isSelectedIncluded) {
          toast.warning("El producto fue creado, pero la sucursal actual no fue seleccionada.");
        }
      }
      form.reset();
      setOpen(false);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al procesar el producto";
      toast.error(message);
      console.error(error);
    }
  };

  //#region Manejo de cambios en modo de venta al cambiar unidad de medida
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "unitType" && value.unitType) {
        if (value.unitType === ProductUnitType.UNIT) {
          form.setValue("contentTotal", 1);
        }

        const currentModes = form.getValues("saleModes") ?? [];

        const compatibleModes = currentModes.filter((mode) =>
          isCompatibleProductUnit(value.unitType!, mode.unitType)
        );

        if (compatibleModes.length < currentModes.length) {
          toast.info("Se quitaron modos de venta no compatibles con la unidad seleccionada.");
          form.setValue("saleModes", compatibleModes);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);
  //#endregion

  //#region Manejo de cambios en presentación y unidad de medida
  const selectedPresentation = form.watch("presentation") as ProductPresentationType | undefined;
  const allowedUnits = getAllowedUnitsByPresentation(selectedPresentation);

  function handlePresentationChange(
    value: ProductPresentationType,
    form: UseFormReturn<ProductRequest>
  ) {
    form.setValue("presentation", value);
    const allowedUnits = getAllowedUnitsByPresentation(value);
    if (allowedUnits.length > 0) {
      form.setValue("unitType", allowedUnits[0], { shouldValidate: true, shouldDirty: true });
    } else {
      form.setValue("unitType", ProductUnitType.UNIT, { shouldValidate: true, shouldDirty: true });
    }
  }
  //#endregion

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
              name="categoryId"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelSelect
                      id="categoryId"
                      label="Selecciona una categoría"
                      value={String(field.value ?? "")}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
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
                      label="Nombre del producto"
                      disabled={form.formState.isSubmitting}
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
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="description"
                      label="Descripción"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="minStock"
                      type="number"
                      label="Stock mínimo"
                      disabled={form.formState.isSubmitting}
                      onChange={(value) => field.onChange(parseInt(value) || "")}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="sku"
                      label="SKU"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="presentation"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelSelect
                      id="presentation"
                      label="Presentación"
                      value={field.value ?? ""}
                      onValueChange={(value) =>
                        handlePresentationChange(value as ProductPresentationType, form)
                      }
                      options={Object.values(ProductPresentationType).map((presentation) => ({
                        value: presentation,
                        label: getProductPresentationTypeLabel(presentation),
                      }))}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem className="gap-0">
                    <FormControl>
                      <FloatingLabelSelect
                        id="unitType"
                        label="Unidad de medida"
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        options={allowedUnits.map((unit) => ({
                          value: unit,
                          label: getProductUnitTypeLabel(unit),
                        }))}
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="contentTotal"
                  render={({ field }) => (
                    <FormItem className="gap-0">
                      <FormControl>
                        <FloatingLabelInput
                          {...field}
                          id="contentTotal"
                          type="number"
                          step="any"
                          label="Contenido total"
                          disabled={
                            form.watch("unitType") === "UNIT" || form.formState.isSubmitting
                          }
                          onChange={(value) => field.onChange(parseFloat(value) || "")}
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />
                <div className="flex items-end h-full">
                  {getProductUnitTypeAbbreviation(form.watch("unitType"))}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="standardPrice"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="standardPrice"
                      type="number"
                      label="Precio estándar"
                      disabled={form.formState.isSubmitting}
                      onChange={(value) => field.onChange(parseFloat(value) || "")}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            {!productId && (
              <FormField
                control={form.control}
                name="branchIds"
                render={({ field }) => (
                  <FormItem className="gap-0">
                    <FormControl>
                      <FloatingLabelMultiSelect
                        id="branchIds"
                        label="Selecciona sucursales"
                        options={branches.map((b) => ({ value: b.id, label: b.name }))}
                        selected={field.value ?? []}
                        onChange={(selected) => field.onChange(selected)}
                        onSearch={handleSearchBranches}
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
            )}

            <ProductSaleModeForm
              control={form.control}
              unitType={form.watch("unitType")}
              contentTotal={form.watch("contentTotal")}
              isEdit={!!productId}
            />

            <div className="flex justify-center">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                {form.formState.isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                {productId ? "Guardar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
