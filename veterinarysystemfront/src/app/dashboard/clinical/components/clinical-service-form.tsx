"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/user-context";
import { getAaxiosErrorMessage } from "@/helpers/error";

import { BranchService } from "@/app/dashboard/branche/services/branch-service";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { BranchActivationInput } from "@/app/dashboard/branche/types/branch-activation-input";
import {
  createClinicalServiceSchema,
  updateClinicalServiceSchema,
  CreateClinicalServiceRequest,
} from "../types/clinical-service-request";
import { ClinicalServiceResponse } from "../types/clinical-service-response";
import ClinicalServiceService from "../service/clinical-service-service";
import {
  ClinicalServiceCategoryOptions,
  ClinicalServiceCategory,
} from "../enums/clinical-service-category";
import { TimeUnit } from "@/enums/time-unit";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { useToast } from "@/hooks/use-toast";
import { ProductQuickSearchResponse } from "../../inventory/_types/product-response";

type BranchState = BranchResponse & { active: boolean };

const timeUnitLabels: Record<TimeUnit, string> = {
  [TimeUnit.DAYS]: "Días",
  [TimeUnit.WEEKS]: "Semanas",
  [TimeUnit.MONTHS]: "Meses",
};

const timeUnitOptions = (Object.values(TimeUnit) as TimeUnit[]).map((unit) => ({
  value: unit,
  label: timeUnitLabels[unit],
}));

type CategoryFieldConfig = {
  showReminder: boolean;
};

const categoryFieldConfig: Record<ClinicalServiceCategory, CategoryFieldConfig> = {
  [ClinicalServiceCategory.CONSULTATION]: { showReminder: false },
  [ClinicalServiceCategory.VACCINATION]: { showReminder: true },
  [ClinicalServiceCategory.DEWORMING]: { showReminder: true },
  [ClinicalServiceCategory.SURGERY]: { showReminder: false },
  [ClinicalServiceCategory.LABORATORY]: { showReminder: false },
  [ClinicalServiceCategory.GROOMING]: { showReminder: false },
  [ClinicalServiceCategory.OTHER]: { showReminder: false },
};

interface ClinicalServiceFormProps {
  setOpen: (open: boolean) => void;
  serviceId?: number;
  onSuccess?: (service: ClinicalServiceResponse) => void;
}

export function ClinicalServiceForm({ setOpen, serviceId, onSuccess }: ClinicalServiceFormProps) {
  const { userInfo } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [branches, setBranches] = React.useState<BranchState[]>([]);
  const [materialsInput, setMaterialsInput] = React.useState("");
  const [productInput, setProductInput] = React.useState("");
  const [productResults, setProductResults] = React.useState<ProductQuickSearchResponse[]>([]);
  const [productSearching, setProductSearching] = React.useState(false);
  const [selectedProducts, setSelectedProducts] = React.useState<
    Array<{ id: number; label: string }>
  >([]);
  const productSearchTimeoutRef = React.useRef<number | null>(null);
  
  const schema = serviceId ? updateClinicalServiceSchema : createClinicalServiceSchema;

  const form = useForm<CreateClinicalServiceRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      clinicalServiceCategory: "" as unknown as ClinicalServiceCategory,
      price: 0,
      reminderPeriod: null,
      reminderPeriodUnit: null,
      requiredSampleTypes: [],
      requiredProductIds: [],
      branches: [],
    },
  });

  const materials = form.watch("requiredSampleTypes") ?? [];

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        const [branchesData, serviceData] = await Promise.all([
          BranchService.getBranches(),
          serviceId ? ClinicalServiceService.getById(serviceId) : Promise.resolve(undefined),
        ]);

        const selectedBranchId = userInfo?.selectedBranch?.id ?? 0;
        const branchesFromService = new Map(
          serviceData?.branches?.map((branch) => [branch.branchId, branch]) ?? []
        );

        const mergedBranches: BranchState[] = branchesData.map((branch) => {
          const fromService = branchesFromService.get(branch.id);
          const active = serviceId ? !!fromService?.active : selectedBranchId === branch.id;
          return {
            ...branch,
            active,
          };
        });

        if (serviceData?.branches) {
          serviceData.branches.forEach((branch) => {
            const exists = mergedBranches.some((item) => item.id === branch.branchId);
            if (!exists) {
              mergedBranches.push({
                id: branch.branchId,
                name: branch.branchName,
                location: "",
                active: branch.active,
              });
            }
          });
        }

        const requiredProducts = serviceData?.requiredProducts ?? [];
        const initialSelectedProducts = requiredProducts.map((product) => ({
          id: product.id,
          label: product.sku ? `${product.name} (${product.sku})` : product.name,
        }));

        form.reset({
          name: serviceData?.name ?? "",
          description: serviceData?.description ?? "",
          clinicalServiceCategory:
            (serviceData?.clinicalServiceCategory ??
              ("" as unknown as ClinicalServiceCategory)),
          price: serviceData?.price ?? 0,
          reminderPeriod: serviceData?.reminderPeriod ?? null,
          reminderPeriodUnit: serviceData?.reminderPeriodUnit ?? null,
          requiredSampleTypes: serviceData?.requiredSampleTypes ?? [],
          requiredProductIds: requiredProducts.map((product) => product.id),
          branches: mergedBranches.map((branch) => ({
            branchId: branch.id,
            active: branch.active,
          })),
        } as CreateClinicalServiceRequest);
        setMaterialsInput("");
        setSelectedProducts(initialSelectedProducts);
        setProductInput("");
        setProductResults([]);
        setProductSearching(false);

        setBranches(mergedBranches);
      } catch (error: unknown) {
        const message =
          getAaxiosErrorMessage(error) ?? "Error al cargar el formulario del servicio clínico";
        toast({
          variant: "destructive",
          title: "Error",
          description: message,
        });
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [serviceId, userInfo?.selectedBranch?.id, form, setOpen]);

  React.useEffect(() => {
    form.setValue(
      "branches",
      branches.map((branch) => ({
        branchId: branch.id,
        active: branch.active,
      })) as BranchActivationInput[]
    );
  }, [branches, form]);

  const reminderPeriodValue = form.watch("reminderPeriod");
  const selectedCategory = form.watch("clinicalServiceCategory") as ClinicalServiceCategory | undefined;
  const currentConfig =
    (selectedCategory && categoryFieldConfig[selectedCategory]) || {
      showReminder: false,
    };

  React.useEffect(() => {
    return () => {
      if (productSearchTimeoutRef.current) {
        window.clearTimeout(productSearchTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (reminderPeriodValue === null || reminderPeriodValue === undefined) {
      if (form.getValues("reminderPeriodUnit") !== null) {
        form.setValue("reminderPeriodUnit", null, { shouldDirty: true });
      }
    }
  }, [reminderPeriodValue, form]);

  React.useEffect(() => {
    if (!currentConfig.showReminder) {
      if (form.getValues("reminderPeriod") !== null) {
        form.setValue("reminderPeriod", null, { shouldDirty: true });
      }
      if (form.getValues("reminderPeriodUnit") !== null) {
        form.setValue("reminderPeriodUnit", null, { shouldDirty: true });
      }
    }
  }, [currentConfig.showReminder, form]);

  const handleBranchToggle = React.useCallback(
    (branchId: number, active: boolean) => {
      setBranches((prev) => {
        const updated = prev.map((branch) =>
          branch.id === branchId ? { ...branch, active } : branch
        );
        return updated;
      });
    },
    []
  );

  const handleAddMaterial = React.useCallback(() => {
    const trimmed = materialsInput.trim();
    if (!trimmed) return;

    const exists = materials.some((material) => material.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setMaterialsInput("");
      return;
    }

    const next = [...materials, trimmed];
    form.setValue("requiredSampleTypes", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setMaterialsInput("");
  }, [materialsInput, materials, form]);

  const handleRemoveMaterial = React.useCallback(
    (value: string) => {
      const next = materials.filter((material) => material !== value);
      form.setValue("requiredSampleTypes", next, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [materials, form]
  );

  const handleMaterialInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        handleAddMaterial();
      }
    },
    [handleAddMaterial]
  );

  const handleSelectProduct = React.useCallback(
    (product: ProductQuickSearchResponse) => {
      const label = product.sku ? `${product.name} (${product.sku})` : product.name;
      const already = selectedProducts.some((item) => item.id === product.id);
      if (already) {
        setProductInput("");
        setProductResults([]);
        return;
      }

      const nextSelected = [...selectedProducts, { id: product.id, label }];
      setSelectedProducts(nextSelected);
      form.setValue(
        "requiredProductIds",
        nextSelected.map((item) => item.id),
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        }
      );
      setProductInput("");
      setProductResults([]);
    },
    [selectedProducts, form]
  );

  const handleRemoveProduct = React.useCallback(
    (productId: number) => {
      const nextSelected = selectedProducts.filter((item) => item.id !== productId);
      setSelectedProducts(nextSelected);
      form.setValue(
        "requiredProductIds",
        nextSelected.map((item) => item.id),
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        }
      );
    },
    [selectedProducts, form]
  );

  const handleProductInputChange = React.useCallback(
    (value: string) => {
      setProductInput(value);
      if (productSearchTimeoutRef.current) {
        window.clearTimeout(productSearchTimeoutRef.current);
      }

      const trimmed = value.trim();
      if (!trimmed) {
        setProductResults([]);
        setProductSearching(false);
        return;
      }

      productSearchTimeoutRef.current = window.setTimeout(async () => {
        try {
          setProductSearching(true);
          const branchId = userInfo?.selectedBranch?.id ?? 0;
          const results = await ProductService.searchProducts(
            trimmed,
            branchId > 0 ? branchId : undefined
          );
          const filtered = results.filter(
            (result) => !selectedProducts.some((item) => item.id === result.id)
          );
          setProductResults(filtered);
        } catch (error) {
          const message = getAaxiosErrorMessage(error) ?? "Error buscando productos";
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });
          setProductResults([]);
        } finally {
          setProductSearching(false);
        }
      }, 400);
    },
    [userInfo?.selectedBranch?.id, selectedProducts]
  );

  const handleProductInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        if (productResults.length > 0) {
          event.preventDefault();
          handleSelectProduct(productResults[0]);
        }
      }
    },
    [productResults, handleSelectProduct]
  );

  const onSubmit = async (values: CreateClinicalServiceRequest) => {
    const sanitizedMaterials = (values.requiredSampleTypes ?? [])
      .map((material) => material.trim())
      .filter((material) => material.length > 0);
    const uniqueMaterials = Array.from(new Set(sanitizedMaterials));
    const uniqueProductIds = Array.from(new Set(values.requiredProductIds ?? []));

    const description = values.description?.trim() ?? "";
    const reminderConfig = categoryFieldConfig[values.clinicalServiceCategory];
    const reminderEnabled = reminderConfig?.showReminder ?? false;

    const reminderPeriod =
      reminderEnabled && values.reminderPeriod !== null && values.reminderPeriod !== undefined
        ? values.reminderPeriod
        : null;
    const reminderPeriodUnit =
      reminderEnabled && values.reminderPeriodUnit ? values.reminderPeriodUnit : null;

    const branchPayload: BranchActivationInput[] = branches.map((branch) => ({
      branchId: branch.id,
      active: branch.active,
    }));

    const payload: CreateClinicalServiceRequest = {
      ...values,
      description: description || undefined,
      requiredSampleTypes: uniqueMaterials,
      requiredProductIds: uniqueProductIds,
      reminderPeriod,
      reminderPeriodUnit,
      branches: branchPayload,
    };

    try {
      if (serviceId) {
        const updated = await ClinicalServiceService.update(serviceId, payload);
        toast({
          variant: "default",
          title: "Éxito",
          description: "Servicio clínico actualizado correctamente",
        });
        onSuccess?.(updated);
      } else {
        const created = await ClinicalServiceService.create(payload);
        toast({
          variant: "default",
          title: "Éxito",
          description: "Servicio clínico registrado exitosamente",
        });
        onSuccess?.(created);
      }
      setMaterialsInput("");
      setSelectedProducts([]);
      setProductInput("");
      setProductResults([]);
      setOpen(false);
    } catch (error: unknown) {
      const message =
        getAaxiosErrorMessage(error) ?? "Error al procesar el servicio clínico";
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    }
  };

  return (
    <div className="max-h-[80vh] overflow-auto p-4">
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clinicalServiceCategory"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelSelect
                      id="clinicalServiceCategory"
                      label="Categoría del servicio"
                      value={field.value ?? ""}
                      onValueChange={(value) => field.onChange(value as ClinicalServiceCategory)}
                      options={ClinicalServiceCategoryOptions.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
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
                      label="Nombre del servicio"
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
              name="price"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="price"
                      type="number"
                      label="Precio estándar"
                      disabled={form.formState.isSubmitting}
                      onChange={(value) => field.onChange(parseFloat(value) || 0)}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            {currentConfig.showReminder && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reminderPeriod"
                  render={({ field }) => (
                    <FormItem className="gap-0">
                      <FormControl>
                        <FloatingLabelInput
                          id="reminderPeriod"
                          type="number"
                          label="Periodo recordatorio"
                          disabled={form.formState.isSubmitting}
                          value={field.value ?? ""}
                          onChange={(value) => {
                            if (value === "") {
                              field.onChange(null);
                              form.setValue("reminderPeriodUnit", null, { shouldDirty: true });
                            } else {
                              const parsed = parseInt(value, 10);
                              field.onChange(Number.isNaN(parsed) ? null : parsed);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reminderPeriodUnit"
                  render={({ field }) => (
                    <FormItem className="gap-0">
                      <FormControl>
                        <FloatingLabelSelect
                          id="reminderPeriodUnit"
                          label="Unidad del periodo"
                          value={field.value ?? ""}
                          onValueChange={(value) => field.onChange(value as TimeUnit)}
                          options={timeUnitOptions}
                          disabled={
                            form.formState.isSubmitting ||
                            reminderPeriodValue === null ||
                            reminderPeriodValue === undefined
                          }
                        />
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="requiredSampleTypes"
              render={() => (
                <FormItem className="gap-0">
                  <FormControl>
                    <div className="space-y-3 rounded-md border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Materiales requeridos
                        </p>
                        <span className="text-xs text-muted-foreground">
                          Presiona Enter o coma para agregar
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {materials.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Aún no has añadido materiales.
                          </p>
                        ) : (
                          materials.map((material) => (
                            <Badge
                              key={material}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {material}
                              <button
                                type="button"
                                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onClick={() => handleRemoveMaterial(material)}
                                disabled={form.formState.isSubmitting}
                                aria-label={`Quitar material ${material}`}
                              >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="requiredSampleTypes-input"
                          value={materialsInput}
                          onChange={(event) => setMaterialsInput(event.target.value)}
                          onKeyDown={handleMaterialInputKeyDown}
                          placeholder="Ej. Jeringas, Gasas, Viales"
                          disabled={form.formState.isSubmitting}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddMaterial}
                          disabled={form.formState.isSubmitting || materialsInput.trim() === ""}
                        >
                          Añadir
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiredProductIds"
              render={() => (
                <FormItem className="gap-0">
                  <FormControl>
                    <div className="space-y-3 rounded-md border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Productos del inventario
                        </p>
                        <span className="text-xs text-muted-foreground">
                          Busca y selecciona productos existentes
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProducts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Aún no has seleccionado productos.
                          </p>
                        ) : (
                          selectedProducts.map((product) => (
                            <Badge
                              key={product.id}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {product.label}
                              <button
                                type="button"
                                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onClick={() => handleRemoveProduct(product.id)}
                                disabled={form.formState.isSubmitting}
                                aria-label={`Quitar producto ${product.label}`}
                              >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                      <div className="space-y-2">
                        <Input
                          id="requiredProductIds-input"
                          value={productInput}
                          onChange={(event) => handleProductInputChange(event.target.value)}
                          onKeyDown={handleProductInputKeyDown}
                          placeholder="Busca por nombre o SKU"
                          disabled={form.formState.isSubmitting}
                          autoComplete="off"
                        />
                        {productInput.trim().length > 0 && (
                          <div className="max-h-48 overflow-y-auto rounded-md border border-dashed border-border">
                            {productSearching ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                Buscando productos…
                              </div>
                            ) : productResults.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                No se encontraron productos.
                              </div>
                            ) : (
                              productResults.map((product) => (
                                <button
                                  type="button"
                                  key={product.id}
                                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => handleSelectProduct(product)}
                                  disabled={form.formState.isSubmitting}
                                >
                                  <span>{product.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {product.sku}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branches"
              render={() => (
                <FormItem className="gap-0">
                  <FormControl>
                    <div className="space-y-2 rounded-md border border-border p-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Activación por sucursal
                      </p>
                      {branches.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No hay sucursales disponibles.
                        </p>
                      ) : (
                        branches.map((branch) => (
                          <div
                            key={branch.id}
                            className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2"
                          >
                            <div>
                              <p className="font-medium">{branch.name}</p>
                              {branch.location && (
                                <p className="text-xs text-muted-foreground">{branch.location}</p>
                              )}
                            </div>
                            <Switch
                              checked={branch.active}
                              disabled={form.formState.isSubmitting}
                              onCheckedChange={(next) => handleBranchToggle(branch.id, next)}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />

            <div className="flex justify-center">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {serviceId ? "Guardar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}

export default ClinicalServiceForm;
