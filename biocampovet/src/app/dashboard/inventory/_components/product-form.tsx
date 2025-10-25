"use client";
import * as React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ProductService from "../_service/product-service";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import { categoryService } from "../_service/category-product-service";
import { useProductContext } from "../_context/product-context-type";
import { productCreateSchema, ProductRequest, productUpdateSchema } from "../_types/product-request";
import { mapToCreateRequest, mapToUpdateRequest } from "../_helpers/product-mapper";
import { ZodTypeAny } from "zod";
import { useUser } from "@/context/user-context";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelMultiSelect } from "@/components/floating-label-multi-select";
import { ProductSaleModeForm } from "./product-sale-mode-form";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { CategoryProductResponse } from "../_types/category-product-response";
import {
  getProductPresentationTypeLabel,
  ProductPresentationType,
} from "../_enums/product-presentation-type";
import { getAllowedUnitsByPresentation } from "../_utils/product-presentation-type-validator";
import { getProductUnitTypeLabel, ProductUnitType } from "../_enums/product-unit-type";
import { isCompatibleProductUnit } from "../_utils/product-unit-type-validator";

import {
  AdministrationRoute,
  AdministrationRouteOptions,
} from "../_enums/administration-route";

interface ProductFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  productId?: number;
}

export function ProductForm({ open, setOpen, productId }: ProductFormProps) {
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
      administrationRoutes: [],
    },
  });

  React.useEffect(() => {
    async function loadData() {
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
            branchIds: product.branchStocks?.map((stock) => stock.id) ?? [],
            id: product.id,
            administrationRoutes: (product.administrationRoutes as AdministrationRoute[]) ?? [],
          });
        }
      } catch (error: unknown) {
        toast.error(getAaxiosErrorMessage(error) || "Error al cargar los datos");
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId, setOpen, userInfo?.selectedBranch?.id, form]);

  const handleSearchBranches = async (query: string) => {
    try {
      const res = await BranchService.getBranches(query);
      setBranches(res);
    } catch {}
  };

  const onSubmit = async (data: ProductRequest) => {
    try {
      if (productId) {
        const updatedProduct = await ProductService.updateProduct(mapToUpdateRequest(data, productId));
        toast.success("Producto actualizado correctamente");
        updateProduct(updatedProduct);
      } else {
        const createdProduct = await ProductService.createProduct(mapToCreateRequest(data));
        toast.success("Producto registrado correctamente");
        const selectedId = userInfo?.selectedBranch?.id ?? 0;
        const branchIds = data.branchIds ?? [];
        const include = branchIds.includes(selectedId);
        const shouldAdd =
          (selectedId > 0 && include) || (branchIds.length > 0 && selectedId === 0);
        if (shouldAdd) addProduct(createdProduct);
        else if (selectedId > 0 && !include)
          toast.warning("El producto fue creado, pero no está disponible en esta sucursal.");
      }
      form.reset();
      setOpen(false);
    } catch (error: unknown) {
      toast.error(getAaxiosErrorMessage(error) || "Error al guardar el producto");
    }
  };

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "unitType" && value.unitType) {
        if (value.unitType === ProductUnitType.UNIT) {
          form.setValue("contentTotal", 1);
        }
        const currentModes = form.getValues("saleModes") ?? [];
        const compatibleModes = currentModes.filter((m) =>
          isCompatibleProductUnit(value.unitType!, m.unitType)
        );
        if (compatibleModes.length < currentModes.length) {
          toast.info("Se eliminaron modos de venta no compatibles.");
          form.setValue("saleModes", compatibleModes);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const selectedPresentation = form.watch("presentation") as ProductPresentationType | undefined;
  const allowedUnits = getAllowedUnitsByPresentation(selectedPresentation);

  function handlePresentationChange(
    value: ProductPresentationType,
    form: UseFormReturn<ProductRequest>
  ) {
    form.setValue("presentation", value);
    const list = getAllowedUnitsByPresentation(value);
    form.setValue("unitType", list[0] ?? ProductUnitType.UNIT, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(96vw,1000px)] max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-4xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">
            {productId ? "Editar producto" : "Registrar producto"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Completa los campos requeridos para registrar o actualizar un producto.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* IDENTIFICACIÓN */}
              <fieldset className="rounded-2xl border p-4">
                <legend className="px-1 text-sm font-semibold">Identificación</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelSelect
                            id="categoryId"
                            label="Categoría *"
                            value={String(field.value ?? "")}
                            onValueChange={(v) => field.onChange(parseInt(v))}
                            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput {...field} id="sku" label="SKU" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput {...field} id="name" label="Nombre del producto *" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput {...field} id="description" label="Descripción" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </fieldset>

              {/* CLASIFICACIÓN, DISPONIBILIDAD Y STOCK */}
              <fieldset className="rounded-2xl border p-4">
                <legend className="px-1 text-sm font-semibold">Clasificación y disponibilidad</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput
                            {...field}
                            id="minStock"
                            type="number"
                            label="Stock mínimo"
                            onChange={(v) => field.onChange(parseInt(v) || "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="standardPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput
                            {...field}
                            id="standardPrice"
                            type="number"
                            step="any"
                            label="Precio estándar"
                            onChange={(v) => field.onChange(parseFloat(v) || "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!productId && (
                  <FormField
                    control={form.control}
                    name="branchIds"
                    render={({ field }) => (
                      <FormItem className="mt-4">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </fieldset>

              {/* PRESENTACIÓN, UNIDAD Y VÍAS DE APLICACIÓN */}
              <fieldset className="rounded-2xl border p-4">
                <legend className="px-1 text-sm font-semibold">Presentación y medidas</legend>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="presentation"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelSelect
                            id="presentation"
                            label="Presentación"
                            value={field.value ?? ""}
                            onValueChange={(v) => handlePresentationChange(v as ProductPresentationType, form)}
                            options={Object.values(ProductPresentationType).map((p) => ({
                              value: p,
                              label: getProductPresentationTypeLabel(p),
                            }))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelSelect
                            id="unitType"
                            label="Unidad de medida"
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                            options={(allowedUnits?.length ? allowedUnits : [ProductUnitType.UNIT]).map((u) => ({
                              value: u,
                              label: getProductUnitTypeLabel(u),
                            }))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contentTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput
                            {...field}
                            id="contentTotal"
                            type="number"
                            step="any"
                            label="Contenido total"
                            disabled={form.watch("unitType") === "UNIT"}
                            onChange={(v) => field.onChange(parseFloat(v) || "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="administrationRoutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelMultiSelect
                            id="administrationRoutes"
                            label="Vías de aplicación (opcional)"
                            options={AdministrationRouteOptions.map((opt) => ({
                              value: opt.value,
                              label: `${opt.label} (${opt.abbreviation})`,
                            }))}
                            selected={(field.value as AdministrationRoute[] | undefined) ?? []}
                            onChange={(selected) => field.onChange(selected as AdministrationRoute[])}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </fieldset>

              {/* MODOS DE VENTA */}
              <fieldset className="rounded-2xl border p-4">
                <legend className="px-1 text-sm font-semibold">Modos de venta</legend>
                <ProductSaleModeForm
                  control={form.control}
                  unitType={form.watch("unitType")}
                  contentTotal={form.watch("contentTotal")}
                  isEdit={!!productId}
                />
              </fieldset>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Guardando..." : productId ? "Guardar" : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
