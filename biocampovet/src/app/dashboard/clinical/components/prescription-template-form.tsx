"use client";

import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandEmpty, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { getAaxiosErrorMessage } from "@/helpers/error";

import {
  CreatePrescriptionTemplateRequest,
  createPrescriptionTemplateSchema,
  updatePrescriptionTemplateSchema,
} from "../types/prescription-template-request";
import {
  PrescriptionTemplateResponse,
} from "../types/prescription-template-response";
import PrescriptionTemplateService from "../service/prescription-template-service";
import { FrequencyUnit, FrequencyUnitLabels } from "../enums/frequency-unit";
import { TimeUnit } from "@/enums/time-unit";
import { ProductUnitType, ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import ProductService from "@/app/dashboard/inventory/_service/product-service";
import { ProductQuickSearchResponse } from "../../inventory/_types/product-response";

const timeUnitLabels: Record<TimeUnit, string> = {
  [TimeUnit.DAYS]: "Días",
  [TimeUnit.WEEKS]: "Semanas",
  [TimeUnit.MONTHS]: "Meses",
};

const frequencyOptions = (Object.values(FrequencyUnit) as FrequencyUnit[]).map((value) => ({
  value,
  label: FrequencyUnitLabels[value],
}));

const durationOptions = (Object.values(TimeUnit) as TimeUnit[]).map((value) => ({
  value,
  label: timeUnitLabels[value],
}));

const dosageUnitOptions: { value: ProductUnitType | ""; label: string }[] = [
  { value: "", label: "Sin unidad" },
  ...(Object.values(ProductUnitType) as ProductUnitType[]).map((value) => ({
    value,
    label: ProductUnitTypeLabels[value],
  })),
];

const templateSchemaMap = {
  create: createPrescriptionTemplateSchema,
  update: updatePrescriptionTemplateSchema,
};

type TemplateSchemaType = typeof templateSchemaMap[keyof typeof templateSchemaMap];

interface PrescriptionTemplateFormProps {
  setOpen: (open: boolean) => void;
  templateId?: number;
  onSuccess?: (template: PrescriptionTemplateResponse) => void;
}

interface SelectedProductInfo {
  id: number;
  label: string;
}

interface MedicationProductSelectorProps {
  selectedProduct?: SelectedProductInfo;
  onSelectProduct: (product: ProductQuickSearchResponse) => void;
  onClear: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const MedicationProductSelector = ({
  selectedProduct,
  onSelectProduct,
  onClear,
  disabled,
  placeholder = "Seleccionar producto del inventario",
}: MedicationProductSelectorProps) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ProductQuickSearchResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id;

  const handleSearch = React.useCallback(
    (term: string) => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      const trimmed = term.trim();
      if (!trimmed) {
        setResults([]);
        setLoading(false);
        return;
      }

      timeoutRef.current = window.setTimeout(async () => {
        try {
          setLoading(true);
          const fetched = await ProductService.searchProducts(
            trimmed,
            branchId && branchId > 0 ? branchId : undefined
          );
          setResults(fetched);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 350);
    },
    [branchId]
  );

  React.useEffect(() => {
    if (query.trim()) {
      handleSearch(query);
    }
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [query, handleSearch]);

  const handleSelect = (product: ProductQuickSearchResponse) => {
    onSelectProduct(product);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="flex-1 justify-between"
              disabled={disabled}
            >
              <span className="truncate">
                {selectedProduct ? selectedProduct.label : placeholder}
              </span>
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0">
            <Command>
              <div className="border-b border-border px-3 py-2">
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Buscar por nombre o SKU…"
                />
              </div>
              <CommandList className="max-h-64 overflow-auto">
                {loading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Buscando productos…
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No se encontraron productos.</CommandEmpty>
                    <CommandGroup>
                      {results.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={`${product.name} ${product.sku ?? ""}`}
                          onSelect={() => handleSelect(product)}
                          className="flex flex-col items-start gap-1 py-2"
                        >
                          <span className="font-medium">{product.name}</span>
                          {product.sku && (
                            <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedProduct && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={disabled}
            aria-label="Limpiar producto seleccionado"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {selectedProduct && (
        <Badge variant="secondary" className="w-fit">
          Producto seleccionado
        </Badge>
      )}
    </div>
  );
};

const defaultMedication = (): CreatePrescriptionTemplateRequest["medications"][number] => ({
  productId: undefined,
  customMedicationName: "",
  dosageAmount: undefined as unknown as number,
  dosageUnit: undefined,
  frequencyValue: 1,
  frequencyUnit: FrequencyUnit.HOURS,
  durationValue: 1,
  durationUnit: TimeUnit.DAYS,
  instructions: "",
});

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      props.className
    )}
  />
);

export function PrescriptionTemplateForm({ setOpen, templateId, onSuccess }: PrescriptionTemplateFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [selectedProducts, setSelectedProducts] = React.useState<(SelectedProductInfo | undefined)[]>([undefined]);

  const schema: TemplateSchemaType = templateId ? templateSchemaMap.update : templateSchemaMap.create;

  const form = useForm<CreatePrescriptionTemplateRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      purpose: "",
      notes: "",
      medications: [defaultMedication()],
    },
  });
  const { reset } = form;

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const initializeFromResponse = React.useCallback(
    (data: PrescriptionTemplateResponse) => {
      const preparedMedications = data.medications.map((med) => ({
        ...defaultMedication(),
        productId: med.productId ?? undefined,
        customMedicationName: med.customMedicationName ?? "",
        dosageAmount: med.dosageAmount,
        dosageUnit: med.dosageUnit ?? undefined,
        frequencyValue: med.frequencyValue,
        frequencyUnit: med.frequencyUnit,
        durationValue: med.durationValue,
        durationUnit: med.durationUnit,
        instructions: med.instructions ?? "",
      }));

      reset({
        name: data.name,
        purpose: data.purpose,
        notes: data.notes ?? "",
        medications: preparedMedications,
      });
      replace(preparedMedications);

      const productState = data.medications.map<SelectedProductInfo | undefined>((med) => {
        if (med.productId && med.productName) {
          const label = med.productName;
          return { id: med.productId, label };
        }
        return undefined;
      });

      setSelectedProducts(productState.length ? productState : [undefined]);
    },
    [reset, replace]
  );

  React.useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        if (templateId) {
          const response = await PrescriptionTemplateService.getById(templateId);
          if (active) {
            initializeFromResponse(response);
          }
        } else {
          reset({
            name: "",
            purpose: "",
            notes: "",
            medications: [defaultMedication()],
          });
          replace([defaultMedication()]);
          setSelectedProducts([undefined]);
        }
      } catch (error) {
        if (active) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              getAaxiosErrorMessage(error) ?? "No se pudo cargar la plantilla de prescripción.",
          });
          setOpen(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [templateId, initializeFromResponse, reset, replace, setOpen, toast]);

  const handleAddMedication = () => {
    append(defaultMedication());
    setSelectedProducts((prev) => [...prev, undefined]);
  };

  const handleRemoveMedication = (index: number) => {
    remove(index);
    setSelectedProducts((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next.length ? next : [undefined];
    });
  };

  const handleSelectProduct = (index: number, product: ProductQuickSearchResponse) => {
    const label = product.sku ? `${product.name} (${product.sku})` : product.name;
    setSelectedProducts((prev) => {
      const next = [...prev];
      next[index] = { id: product.id, label };
      return next;
    });
    form.setValue(`medications.${index}.productId`, product.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleClearProduct = (index: number) => {
    setSelectedProducts((prev) => {
      const next = [...prev];
      next[index] = undefined;
      return next;
    });
    form.setValue(`medications.${index}.productId`, undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (values: CreatePrescriptionTemplateRequest) => {
    const payload = {
      ...values,
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
      medications: values.medications.map((med) => ({
        ...med,
        customMedicationName: med.customMedicationName?.trim() || undefined,
        instructions: med.instructions?.trim() || undefined,
      })),
    } satisfies CreatePrescriptionTemplateRequest;

    try {
      if (templateId) {
        const updated = await PrescriptionTemplateService.update(templateId, payload);
        toast({
          variant: "default",
          title: "Plantilla actualizada",
          description: "La plantilla de prescripción fue actualizada correctamente.",
        });
        onSuccess?.(updated);
      } else {
        const created = await PrescriptionTemplateService.create(payload);
        toast({
          variant: "default",
          title: "Plantilla creada",
          description: "La plantilla de prescripción fue registrada correctamente.",
        });
        onSuccess?.(created);
        reset({
          name: "",
          purpose: "",
          notes: "",
          medications: [defaultMedication()],
        });
        replace([defaultMedication()]);
        setSelectedProducts([undefined]);
      }
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          getAaxiosErrorMessage(error) ?? "No se pudo guardar la plantilla de prescripción.",
      });
    }
  };

  return (
    <div className="max-h-[80vh] overflow-auto">
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="template-name"
                      label="Nombre de la plantilla"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="template-purpose"
                      label="Propósito clínico"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      id="template-notes"
                      placeholder="Notas generales para la prescripción (opcional)"
                      disabled={form.formState.isSubmitting}
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Medicamentos</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddMedication}
                  disabled={form.formState.isSubmitting}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir medicamento
                </Button>
              </div>

              {fields.length === 0 && (
                <div className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Aún no has agregado medicamentos a la plantilla.
                </div>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-3 rounded-md border border-dashed border-border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">Medicamento #{index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMedication(index)}
                      disabled={form.formState.isSubmitting || fields.length === 1}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Quitar
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`medications.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-2">
                              <input
                                type="hidden"
                                name={field.name}
                                value={field.value ?? ""}
                                ref={field.ref}
                              />
                              <MedicationProductSelector
                                selectedProduct={selectedProducts[index]}
                                onSelectProduct={(product) =>
                                  handleSelectProduct(index, product)
                                }
                                onClear={() => handleClearProduct(index)}
                                disabled={form.formState.isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`medications.${index}.customMedicationName`}
                      render={({ field: customNameField }) => (
                        <FormItem>
                          <FormControl>
                            <FloatingLabelInput
                              {...customNameField}
                              id={`medications-${index}-custom-name`}
                              label="Nombre personalizado"
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`medications.${index}.dosageAmount`}
                      render={({ field: dosageAmountField }) => (
                        <FormItem>
                          <FormControl>
                            <FloatingLabelInput
                              {...dosageAmountField}
                              id={`medications-${index}-dosage-amount`}
                              type="number"
                              step="0.01"
                              label="Cantidad por dosis"
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`medications.${index}.dosageUnit`}
                      render={({ field: dosageUnitField }) => (
                        <FormItem>
                          <FormControl>
                            <FloatingLabelSelect
                              id={`medications-${index}-dosage-unit`}
                              label="Unidad de dosificación"
                              value={dosageUnitField.value ?? ""}
                              onValueChange={(v) => dosageUnitField.onChange(v === "" ? undefined : (v as ProductUnitType))}
                              options={dosageUnitOptions}
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`medications.${index}.frequencyValue`}
                      render={({ field: frequencyValueField }) => (
                        <FormItem>
                          <FormControl>
                            <FloatingLabelInput
                              {...frequencyValueField}
                              id={`medications-${index}-frequency-value`}
                              type="number"
                              step="1"
                              label="Frecuencia"
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`medications.${index}.frequencyUnit`}
                      render={({ field: frequencyUnitField }) => (
                        <FormItem>
                          <FormControl>
                            <FloatingLabelSelect
                              id={`medications-${index}-frequency-unit`}
                              label="Unidad de frecuencia"
                              value={frequencyUnitField.value}
                              onValueChange={(value) =>
                                frequencyUnitField.onChange(value as FrequencyUnit)
                              }
                              options={frequencyOptions}
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`medications.${index}.durationValue`}
                      render={({ field: durationValueField }) => (
                        <FormItem>
                          <FormControl>
                            <FloatingLabelInput
                              {...durationValueField}
                              id={`medications-${index}-duration-value`}
                              type="number"
                              step="1"
                              label="Duración"
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`medications.${index}.durationUnit`}
                      render={({ field: durationUnitField }) => (
                        <FormItem>
                          <FormControl>
                            <FloatingLabelSelect
                              id={`medications-${index}-duration-unit`}
                              label="Unidad de duración"
                              value={durationUnitField.value}
                              onValueChange={(value) =>
                                durationUnitField.onChange(value as TimeUnit)
                              }
                              options={durationOptions}
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`medications.${index}.instructions`}
                    render={({ field: instructionsField }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            id={`medications-${index}-instructions`}
                            placeholder="Instrucciones para el propietario (opcional)"
                            disabled={form.formState.isSubmitting}
                            value={instructionsField.value ?? ""}
                            onChange={(event) => instructionsField.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {templateId ? "Guardar cambios" : "Registrar plantilla"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}

export default PrescriptionTemplateForm;
