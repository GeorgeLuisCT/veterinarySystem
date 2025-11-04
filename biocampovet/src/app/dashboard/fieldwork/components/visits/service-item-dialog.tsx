"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelMultiSelect } from "@/components/floating-label-multi-select";
import { Textarea } from "@/components/ui/textarea";
import { AddServiceItemRequest, addServiceItemSchema } from "../../types/visit-request";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import VisitService from "../../services/visit-service";
import ClinicalServiceService from "@/app/dashboard/clinical/service/clinical-service-service";
import { ClinicalServiceQuickSearchResponse } from "@/app/dashboard/clinical/types/clinical-service-response";
import { EmployeeService } from "@/app/dashboard/staff/service/employee-service";
import { EmployeeQuickSearchResponse } from "@/app/dashboard/staff/types/employee-quick-search-response";
import AnimalService from "@/app/dashboard/crm/patients/service/animal-service";
import { AnimalQuickSearchResponse } from "@/app/dashboard/crm/patients/types/animal-quick-search-response";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { ProductQuickSearchResponse } from "@/app/dashboard/inventory/products/types/product-quick-search-response";
import { AnimalSpecies, AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";
import { AdministrationRoute, AdministrationRouteLabels } from "@/app/dashboard/inventory/_enums/administration-route";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { PlusCircle, Trash2 } from "lucide-react";
import { useUser } from "@/context/user-context";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: number;
  onSuccess: () => void;
};

type SelectOption = { value: string; label: string };

export default function ServiceItemDialog({ open, onOpenChange, visitId, onSuccess }: Props) {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id;

  const [serviceOptions, setServiceOptions] = React.useState<SelectOption[]>([]);
  const [serviceResults, setServiceResults] = React.useState<ClinicalServiceQuickSearchResponse[]>([]);
  const [employeeOptions, setEmployeeOptions] = React.useState<SelectOption[]>([]);
  const [employeeResults, setEmployeeResults] = React.useState<EmployeeQuickSearchResponse[]>([]);
  const [animalOptions, setAnimalOptions] = React.useState<AnimalQuickSearchResponse[]>([]);
  const [productOptionsMap, setProductOptionsMap] = React.useState<Record<number, SelectOption[]>>({});

  const speciesOptions = React.useMemo(
    () =>
      (Object.values(AnimalSpecies) as AnimalSpecies[]).map((species) => ({
        value: species,
        label: AnimalSpeciesLabels[species] ?? species,
      })),
    []
  );

  const defaultSpecies = speciesOptions[0]?.value ?? AnimalSpecies.BOVINE;

  const routeOptions = React.useMemo(
    () => Object.entries(AdministrationRouteLabels).map(([value, label]) => ({ value, label })),
    []
  );

  const unitOptions = React.useMemo(
    () => Object.entries(ProductUnitTypeLabels).map(([value, label]) => ({ value, label })),
    []
  );

  const defaultRoute = React.useMemo(() => {
    if (routeOptions.length > 0) {
      return routeOptions[0].value as AdministrationRoute;
    }
    return (Object.values(AdministrationRoute) as AdministrationRoute[])[0];
  }, [routeOptions]);

  const defaultUnit = React.useMemo(() => {
    if (unitOptions.length > 0) {
      return unitOptions[0].value as ProductUnitType;
    }
    return (Object.values(ProductUnitType) as ProductUnitType[])[0];
  }, [unitOptions]);

  const form = useForm<AddServiceItemRequest>({
    resolver: zodResolver(addServiceItemSchema),
    defaultValues: {
      clinicalServiceId: undefined,
      quantity: 1,
      unitPrice: 0,
      performedById: undefined,
      notes: "",
      animalIds: [],
      groups: [],
      products: [],
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
  } = form;

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control,
    name: "groups",
  });

  const { fields: productFields, append: appendProduct, remove: removeProduct, replace: replaceProducts } = useFieldArray({
    control,
    name: "products",
  });

  const selectedAnimalIds = watch("animalIds") ?? [];
  const currentServiceId = watch("clinicalServiceId");
  const productFieldCount = productFields.length;

  const animalSelectOptions = React.useMemo(() => {
    const map = new Map<number, AnimalQuickSearchResponse>();
    animalOptions.forEach((animal) => map.set(animal.id, animal));
    selectedAnimalIds.forEach((id) => {
      if (!map.has(id)) {
        map.set(id, { id, name: `Animal #${id}`, species: AnimalSpecies.OTHER, birthDate: "", ownerName: "", photoUrl: null, microchipNumber: null });
      }
    });
    return Array.from(map.values()).map((animal) => ({
      value: animal.id,
      label: `${animal.name} · ${AnimalSpeciesLabels[animal.species] ?? animal.species}`,
    }));
  }, [animalOptions, selectedAnimalIds]);

  const loadServiceDetails = React.useCallback(
    async (serviceId: number) => {
      try {
        const detail: ClinicalServiceResponse = await ClinicalServiceService.getById(serviceId);
        const currentPrice = getValues("unitPrice");
        if ((!currentPrice || currentPrice === 0) && detail.price) {
          setValue("unitPrice", detail.price, { shouldValidate: true });
        }
        const rows = (detail.requiredProducts ?? []).map((rp) => ({
          productId: rp.id,
          dose: 1,
          unit: defaultUnit,
          administrationRoute: defaultRoute,
        }));
        replaceProducts(rows);
        setProductOptionsMap(() => {
          const updated: Record<number, SelectOption[]> = {};
          (detail.requiredProducts ?? []).forEach((rp, index) => {
            updated[index] = [{ value: String(rp.id), label: rp.name }];
          });
          return updated;
        });
      } catch (error) {
        replaceProducts([]);
        setProductOptionsMap({});
        console.error(error);
      }
    },
    [defaultRoute, defaultUnit, getValues, replaceProducts, setValue]
  );

  const handleSearchServices = React.useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setServiceOptions([]);
        setServiceResults([]);
        return;
      }
      try {
        const results = await ClinicalServiceService.quickSearch(trimmed, branchId);
        setServiceResults(results);
        setServiceOptions(
          results.map((service) => ({
            value: String(service.id),
            label: service.name,
          }))
        );
      } catch (error) {
        setServiceResults([]);
        setServiceOptions([]);
        toast({
          variant: "destructive",
          title: "Error al buscar servicios",
          description: getAaxiosErrorMessage(error) ?? "No se pudo realizar la búsqueda.",
        });
      }
    },
    [branchId, toast]
  );

  const handleSearchEmployees = React.useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setEmployeeOptions([]);
        setEmployeeResults([]);
        return;
      }
      try {
        const results = await EmployeeService.searchEmployees(trimmed, branchId);
        setEmployeeResults(results);
        setEmployeeOptions(results.map((employee) => ({ value: String(employee.id), label: employee.fullName })));
      } catch (error) {
        setEmployeeOptions([]);
        setEmployeeResults([]);
        toast({
          variant: "destructive",
          title: "Error al buscar personal",
          description: getAaxiosErrorMessage(error) ?? "No se pudo buscar al personal.",
        });
      }
    },
    [branchId, toast]
  );

  const handleSearchAnimals = React.useCallback(
    async (query: string) => {
      try {
        const results = await AnimalService.searchAnimals(query);
        setAnimalOptions((prev) => {
          const merged = new Map<number, AnimalQuickSearchResponse>();
          prev.forEach((animal) => merged.set(animal.id, animal));
          results.forEach((animal) => merged.set(animal.id, animal));
          return Array.from(merged.values());
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error al buscar animales",
          description: getAaxiosErrorMessage(error) ?? "No se pudo buscar animales.",
        });
      }
    },
    [toast]
  );

  const handleSearchProducts = React.useCallback(
    async (rowIndex: number, query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setProductOptionsMap((prev) => ({ ...prev, [rowIndex]: [] }));
        return;
      }
      try {
        const results: ProductQuickSearchResponse[] = await ProductService.searchProducts(trimmed, branchId);
        setProductOptionsMap((prev) => ({
          ...prev,
          [rowIndex]: results.map((product) => ({ value: String(product.id), label: product.name })),
        }));
      } catch (error) {
        setProductOptionsMap((prev) => ({ ...prev, [rowIndex]: [] }));
        toast({
          variant: "destructive",
          title: "Error al buscar productos",
          description: getAaxiosErrorMessage(error) ?? "No se pudo buscar productos.",
        });
      }
    },
    [branchId, toast]
  );

  const onSubmit = async (values: AddServiceItemRequest) => {
    try {
      await VisitService.addServiceItem(visitId, values);
      toast({ title: "Servicio agregado", description: "El servicio se registró correctamente." });
      onSuccess();
      reset({ quantity: 1, unitPrice: 0, notes: "", clinicalServiceId: undefined, performedById: undefined, animalIds: [], groups: [], products: [] });
      replaceProducts([]);
      setProductOptionsMap({});
      setServiceOptions([]);
      setServiceResults([]);
      setEmployeeOptions([]);
      setEmployeeResults([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo registrar el servicio",
        description: getAaxiosErrorMessage(error),
      });
    }
  };

  const handleAddGroup = React.useCallback(() => {
    appendGroup({
      species: defaultSpecies,
      breed: "",
      quantity: 1,
      description: "",
    });
  }, [appendGroup, defaultSpecies]);

  const handleAddProduct = React.useCallback(() => {
    const newIndex = productFieldCount;
    appendProduct({
      productId: undefined,
      dose: 1,
      unit: defaultUnit,
      administrationRoute: defaultRoute,
    });
    setProductOptionsMap((prev) => ({ ...prev, [newIndex]: [] }));
  }, [appendProduct, defaultRoute, defaultUnit, productFieldCount]);

  React.useEffect(() => {
    if (!open) {
      reset({
        clinicalServiceId: undefined,
        quantity: 1,
        unitPrice: 0,
        performedById: undefined,
        notes: "",
        animalIds: [],
        groups: [],
        products: [],
      });
      setServiceOptions([]);
      setServiceResults([]);
      setEmployeeOptions([]);
      setEmployeeResults([]);
      replaceProducts([]);
      setProductOptionsMap({});
    }
  }, [open, reset, replaceProducts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Añadir servicio</DialogTitle>
          <DialogDescription>Registra la prestación realizada en la visita.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={control}
                name="clinicalServiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="clinicalServiceId"
                        label="Servicio *"
                        value={field.value ? String(field.value) : ""}
                        options={serviceOptions}
                        onValueChange={(value) => {
                          if (!value) {
                            field.onChange(undefined);
                            replaceProducts([]);
                            setProductOptionsMap({});
                            return;
                          }
                          const id = Number(value);
                          field.onChange(id);
                          const found = serviceResults.find((service) => service.id === id);
                          if (found?.price != null) {
                            setValue("unitPrice", found.price, { shouldValidate: true });
                          }
                          loadServiceDetails(id);
                        }}
                        onSearch={handleSearchServices}
                        placeholder="Buscar servicio..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="performedById"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelSelect
                        id="performedById"
                        label="Ejecutante"
                        value={field.value ? String(field.value) : ""}
                        options={employeeOptions}
                        onValueChange={(value) => {
                          if (!value) {
                            field.onChange(undefined);
                            return;
                          }
                          field.onChange(Number(value));
                        }}
                        onSearch={handleSearchEmployees}
                        placeholder="Buscar colaborador..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="quantity"
                        label="Cantidad *"
                        type="number"
                        min="1"
                        value={field.value === undefined ? "" : String(field.value)}
                        onChange={(value) => field.onChange(value === "" ? undefined : Number(value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput
                        id="unitPrice"
                        label="Precio unitario *"
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.value === undefined ? "" : String(field.value)}
                        onChange={(value) => field.onChange(value === "" ? undefined : Number(value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="animalIds"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <FloatingLabelMultiSelect<number>
                        id="animalIds"
                        label="Animales atendidos"
                        options={animalSelectOptions}
                        selected={field.value ?? []}
                        onChange={(selected) => field.onChange(selected)}
                        onSearch={handleSearchAnimals}
                      />
                      <p className="text-xs text-muted-foreground">Selecciona uno o varios animales registrados para vincular el servicio.</p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Productos utilizados</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProduct}
                  className="flex items-center gap-1"
                  disabled={!currentServiceId}
                >
                  <PlusCircle className="h-4 w-4" />
                  Añadir producto
                </Button>
              </div>
              <div className="space-y-3">
                {productFields.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Al seleccionar un servicio se precargan sus insumos requeridos. Ajusta las dosis y agrega productos adicionales si lo necesitas.
                  </p>
                ) : null}
                {productFields.map((fieldItem, index) => (
                  <div key={fieldItem.id} className="space-y-3 rounded-lg border p-3">
                    <div className="grid gap-3 md:grid-cols-[2fr,1fr,1fr,1fr,auto] md:items-end">
                      <FormField
                        control={control}
                        name={`products.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelSelect
                                id={`products.${index}.productId`}
                                label="Producto *"
                                value={field.value ? String(field.value) : ""}
                                options={productOptionsMap[index] ?? []}
                                onSearch={(query) => handleSearchProducts(index, query)}
                                onValueChange={(value) => {
                                  if (!value) {
                                    field.onChange(undefined);
                                    setProductOptionsMap((prev) => ({ ...prev, [index]: [] }));
                                    return;
                                  }
                                  const optionList = productOptionsMap[index] ?? [];
                                  const option = optionList.find((opt) => opt.value === value) ?? {
                                    value,
                                    label: `Producto #${value}`,
                                  };
                                  field.onChange(Number(value));
                                  setProductOptionsMap((prev) => ({ ...prev, [index]: [option] }));
                                }}
                                placeholder="Buscar producto..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`products.${index}.dose`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelInput
                                id={`products.${index}.dose`}
                                label="Dosis *"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={field.value === undefined ? "" : String(field.value)}
                                onChange={(value) => field.onChange(value === "" ? undefined : Number(value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`products.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelSelect
                                id={`products.${index}.unit`}
                                label="Unidad *"
                                value={field.value ?? defaultUnit}
                                options={unitOptions}
                                onValueChange={(value) => field.onChange(value as ProductUnitType)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`products.${index}.administrationRoute`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelSelect
                                id={`products.${index}.administrationRoute`}
                                label="Vía *"
                                value={field.value ?? defaultRoute}
                                options={routeOptions}
                                onValueChange={(value) => field.onChange(value as AdministrationRoute)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          removeProduct(index);
                          setProductOptionsMap((prev) => {
                            const remaining = getValues("products") ?? [];
                            const updated: Record<number, SelectOption[]> = {};
                            remaining.forEach((prod, idx2) => {
                              if (!prod || prod.productId == null) return;
                              const flat = Object.values(prev).flat();
                              const option = flat.find((opt) => opt.value === String(prod.productId));
                              updated[idx2] = [
                                option ?? { value: String(prod.productId), label: `Producto #${prod.productId}` },
                              ];
                            });
                            return updated;
                          });
                        }}
                        className="self-start text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Grupos no registrados</h4>
                <Button type="button" variant="outline" size="sm" onClick={handleAddGroup} className="flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Añadir grupo
                </Button>
              </div>
              <div className="space-y-3">
                {groupFields.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Registra grupos de animales (por ejemplo “200 ovejas”) que no estén identificados individualmente.</p>
                ) : null}
                {groupFields.map((fieldItem, index) => (
                  <div key={fieldItem.id} className="rounded-lg border p-3 space-y-3">
                    <div className="grid gap-3 md:grid-cols-[1.5fr,1.5fr,0.8fr,auto] md:items-end">
                      <FormField
                        control={control}
                        name={`groups.${index}.species`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelSelect
                                id={`groups.${index}.species`}
                                label="Especie *"
                                value={field.value ?? ""}
                                options={speciesOptions.map((option) => ({ value: option.value, label: option.label }))}
                                onValueChange={(value) => field.onChange(value as AnimalSpecies)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`groups.${index}.breed`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelInput
                                id={`groups.${index}.breed`}
                                label="Raza"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`groups.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelInput
                                id={`groups.${index}.quantity`}
                                label="Cantidad *"
                                type="number"
                                min="1"
                                value={field.value === undefined ? "" : String(field.value)}
                                onChange={(value) => field.onChange(value === "" ? undefined : Number(value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGroup(index)}
                        className="self-start text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar grupo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormField
                      control={control}
                      name={`groups.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              id={`groups.${index}.description`}
                              placeholder="Descripción adicional (opcional)"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="notes"
                      placeholder="Notas adicionales"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  reset({
                    clinicalServiceId: undefined,
                    quantity: 1,
                    unitPrice: 0,
                    performedById: undefined,
                    notes: "",
                    animalIds: [],
                    groups: [],
                  })
                }
              >
                Limpiar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
