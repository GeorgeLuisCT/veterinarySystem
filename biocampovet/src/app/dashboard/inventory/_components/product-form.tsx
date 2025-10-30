"use client";
import * as React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import ProductService from "../_service/product-service";
import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import { categoryService } from "../_service/category-product-service";
import { useProductContext } from "../_context/product-context-type";
import { productCreateSchema, ProductRequest, productUpdateSchema } from "../_types/product-request";
import { mapToCreateRequest, mapToUpdateRequest, presentationToUnitMap } from "../_helpers/product-mapper";
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
import {
  getProductUnitTypeAbbreviation,
  getProductUnitTypeLabelByQuantity,
  ProductUnitType,
} from "../_enums/product-unit-type";
import {
  AdministrationRoute,
  AdministrationRouteOptions,
} from "../_enums/administration-route";
import { ProductResponse } from "../_types/product-response";
import { ProductSaleModeRequest } from "../_types/product-sale-mode-request";
import { useToast } from "@/hooks/use-toast";

interface ProductFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  productId?: number;
}

function mapApiResponseToForm(product: ProductResponse): ProductRequest {
  const baseMode = product.saleModes.find((m) => m.baseMode);
  const otherModes = product.saleModes.filter((m) => !m.baseMode);
  const mainEquivalent = baseMode?.relativeQuantity ?? 1;

  const mappedSaleModes: ProductSaleModeRequest[] = otherModes.map((mode) => {
    let relativeUnitType = baseMode?.unitType ?? ProductUnitType.UNIT;
    let relativeQuantity = mode.relativeQuantity / mainEquivalent;
    if (relativeQuantity % 1 !== 0 || relativeQuantity === 0) {
      relativeUnitType = product.unitType;
      relativeQuantity = mode.relativeQuantity;
    }
    return {
      id: (mode as any).id,
      unitType: mode.unitType,
      price: mode.price,
      relativeQuantity: relativeQuantity,
      relativeUnitType: relativeUnitType,
    };
  });

  return {
    name: product.name,
    description: product.description ?? "",
    minStock: product.minStock ?? 0,
    categoryId: product.categoryResponse.id,
    sku: product.sku,
    presentation: product.presentation,
    unitType: product.unitType,
    standardPrice: product.standardPrice,
    contentTotal: product.contentTotal ?? 0,
    saleModes: mappedSaleModes,
    branchIds: product.branchStocks?.map((stock) => stock.branchId) ?? [],
    id: product.id,
    administrationRoutes: (product.administrationRoutes as AdministrationRoute[]) ?? [],
  };
}

export function ProductForm({ open, setOpen, productId }: ProductFormProps) {
  const [branches, setBranches] = React.useState<BranchResponse[]>([]);
  const [categories, setCategories] = React.useState<CategoryProductResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { addProduct, updateProduct } = useProductContext();
  const { userInfo } = useUser();
  const schema: ZodTypeAny = productId ? productUpdateSchema : productCreateSchema;

  const { toast } = useToast();

  const form = useForm<ProductRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      minStock: 0,
      categoryId: 0,
      sku: "",
      presentation: ProductPresentationType.BOTTLE,
      unitType: ProductUnitType.MILLILITER,
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
          const formData = mapApiResponseToForm(product);
          form.reset(formData);
        }
      } catch (error: unknown) {
        toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) || "Error al cargar los datos" });
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId, setOpen, userInfo?.selectedBranch?.id, form, toast]);

  const handleSearchBranches = async (query: string) => {
    try {
      const res = await BranchService.getBranches(query);
      setBranches(res);
    } catch { }
  };

  const onSubmit = async (data: ProductRequest) => {
    try {
      if (productId) {
        const req = mapToUpdateRequest(data, productId);
        const updatedProduct = await ProductService.updateProduct(req);
        toast({ variant: "default", title: "Exito", description: "Producto actualizado correctamente" });
        updateProduct(updatedProduct);
      } else {
        const req = mapToCreateRequest(data);
        const createdProduct = await ProductService.createProduct(req);
        toast({ variant: "default", title: "Exito", description: "Producto registrado correctamente" });
        const selectedId = userInfo?.selectedBranch?.id ?? 0;
        const branchIds = data.branchIds ?? [];
        const include = branchIds.includes(selectedId);
        const shouldAdd = (selectedId > 0 && include) || (branchIds.length > 0 && selectedId === 0);
        if (shouldAdd) addProduct(createdProduct);
        else if (selectedId > 0 && !include)
          toast({ variant: "destructive", title: "Error", description: "El producto fue creado, pero no está disponible en esta sucursal." });
      }
      form.reset();
      setOpen(false);
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) || "Error al guardar el producto" });
    }
  };

  const selectedPresentation = form.watch("presentation") as ProductPresentationType | undefined;
  const allowedBaseUnits = getAllowedUnitsByPresentation(selectedPresentation);
  const baseUnit = form.watch("unitType")
  const contentTotalVal = form.watch("contentTotal");
  const priceVal = form.watch("standardPrice");

  const isLockedUnit = React.useMemo(() => {
    if (!selectedPresentation || !baseUnit) return false;

    const mainUnit = presentationToUnitMap[selectedPresentation] ?? ProductUnitType.UNIT;

    const baseIsUnit = baseUnit === ProductUnitType.UNIT;

    return mainUnit === ProductUnitType.UNIT && baseIsUnit;
  }, [selectedPresentation, baseUnit]);

  function handlePresentationChange(value: ProductPresentationType, form: UseFormReturn<ProductRequest>) {
    form.setValue("presentation", value);
    const list = getAllowedUnitsByPresentation(value);

    const newUnitType = list[0] ?? ProductUnitType.UNIT;
    form.setValue("unitType", newUnitType, {
      shouldValidate: true,
      shouldDirty: true,
    });

    const mainUnit = presentationToUnitMap[value] ?? ProductUnitType.UNIT;

    if (mainUnit === ProductUnitType.UNIT && newUnitType === ProductUnitType.UNIT) {
      form.setValue("contentTotal", 1, { shouldValidate: true, shouldDirty: true });
    }
  }

  React.useEffect(() => {
    if (isLockedUnit) {
      form.setValue("contentTotal", 1, { shouldValidate: true, shouldDirty: true });
    }
  }, [isLockedUnit, form]);

  const formatPEN = (n?: number | string) => {
    const num = typeof n === "string" ? Number(n) : n;
    if (num == null || isNaN(num)) return "";
    return `S/. ${Number(num).toFixed(2)}`;
  };

  const summaryText = React.useMemo(() => {
    if (!selectedPresentation || !baseUnit) return "";
    const presLabel = getProductPresentationTypeLabel(selectedPresentation)?.toLowerCase() ?? "presentación";
    const qty = Number(contentTotalVal) || 0;
    const unitLabel = getProductUnitTypeLabelByQuantity(baseUnit, qty)?.toLowerCase();
    const priceText = priceVal != null && priceVal !== undefined ? formatPEN(priceVal) : "";
    const qtyText = qty > 0 ? qty : "…";
    const uText = unitLabel || "…";
    const pText = priceText || "…";

    if (isLockedUnit && qty === 1) {
      return `${qtyText} ${presLabel} a ${pText}`;
    }
    return `${presLabel} de ${qtyText} ${uText} a ${pText}`;
  }, [selectedPresentation, baseUnit, contentTotalVal, priceVal, isLockedUnit]);

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

              <fieldset className="rounded-2xl border p-4">
                <legend className="px-1 text-sm font-semibold">Presentación y Medidas</legend>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="presentation"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelSelect
                            id="presentation"
                            label="Presentación Principal"
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
                            label="Unidad de medida de la Presentación"
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                            options={(allowedBaseUnits?.length ? allowedBaseUnits : [ProductUnitType.UNIT]).map((u) => ({
                              value: u,
                              label: getProductUnitTypeLabelByQuantity(u, 1),
                            }))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-[4px] h-full">
                    <FormField
                      control={form.control}
                      name="contentTotal"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <FloatingLabelInput
                              {...field}
                              id="contentTotal"
                              type="number"
                              step="any"
                              label="Contenido de la Presentación"
                              onChange={(v) => field.onChange(parseFloat(v) || "")}
                              disabled={isLockedUnit}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end h-full pt-2">
                      {baseUnit && getProductUnitTypeAbbreviation(baseUnit)}
                    </div>
                  </div>
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
                            label="Precio de la Presentación"
                            onChange={(v) => field.onChange(parseFloat(v) || "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-3 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    {summaryText || "Completa la presentación, contenido, unidad y precio para ver el resumen."}
                  </span>
                </div>
              </fieldset>

              <fieldset className="rounded-2xl border p-4">
                <legend className="px-1 text-sm font-semibold">Disponibilidad y Aplicación</legend>
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
                    name="administrationRoutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelMultiSelect
                            id="administrationRoutes"
                            label="Vías de aplicación *"
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

                {!productId && (
                  <FormField
                    control={form.control}
                    name="branchIds"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormControl>
                          <FloatingLabelMultiSelect
                            id="branchIds"
                            label="Sucursales Disponibles"
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

              <fieldset className="rounded-2xl border p-4">
                <legend className="px-1 text-sm font-semibold">Otros modos de venta</legend>
                <ProductSaleModeForm
                  control={form.control}
                  baseUnitType={form.watch("unitType")}
                  presentationType={form.watch("presentation")}
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