"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useUser } from "@/context/user-context";

import {
  createHealthPlanSchema,
  updateHealthPlanSchema,
  CreateHealthPlanRequest,
} from "../types/health-plan-request";
import { HealthPlanResponse } from "../types/health-plan-response";
import HealthPlanService from "../service/health-plan-service";
import ClinicalServiceService from "../service/clinical-service-service";
import { ClinicalServiceQuickSearchResponse } from "../types/clinical-service-response";

interface HealthPlanFormProps {
  setOpen: (open: boolean) => void;
  planId?: number;
  onSuccess?: (plan: HealthPlanResponse) => void;
}

interface SelectedServiceInfo {
  id: number;
  label: string;
  category?: string;
  price?: number | null;
}

interface ServiceSelectorProps {
  selectedService?: SelectedServiceInfo;
  onSelectService: (service: ClinicalServiceQuickSearchResponse) => void;
  onClear: () => void;
  disabled?: boolean;
}

const ServiceSelector = ({
  selectedService,
  onSelectService,
  onClear,
  disabled,
}: ServiceSelectorProps) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ClinicalServiceQuickSearchResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);
  const { userInfo } = useUser();
  const { toast } = useToast();

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
          const fetched = await ClinicalServiceService.quickSearch(
            trimmed,
            branchId && branchId > 0 ? branchId : undefined
          );
          setResults(fetched);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: getAaxiosErrorMessage(error) ?? "No se pudo buscar servicios clínicos.",
          });
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 350);
    },
    [branchId, toast]
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

  const handleSelect = (service: ClinicalServiceQuickSearchResponse) => {
    onSelectService(service);
    setOpen(false);
    setQuery("");
    setResults([]);
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
                {selectedService ? selectedService.label : "Seleccionar servicio clínico"}
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
                  placeholder="Buscar por nombre de servicio…"
                />
              </div>
              <CommandList className="max-h-64 overflow-auto">
                {loading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Buscando servicios…
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No se encontraron servicios.</CommandEmpty>
                    <CommandGroup>
                      {results.map((service) => (
                        <CommandItem
                          key={service.id}
                          value={service.name}
                          onSelect={() => handleSelect(service)}
                          className="flex flex-col items-start gap-1 py-2"
                        >
                          <span className="font-medium">{service.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {service.clinicalServiceCategory}
                          </span>
                          {service.price !== null && (
                            <span className="text-xs text-muted-foreground">
                              Precio estimado: S/ {Number(service.price).toFixed(2)}
                            </span>
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
        {selectedService && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={disabled}
            aria-label="Quitar servicio seleccionado"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {selectedService?.category && (
        <Badge variant="secondary" className="w-fit">
          {selectedService.category}
        </Badge>
      )}
    </div>
  );
};

const defaultServiceItem = (): CreateHealthPlanRequest["serviceItems"][number] => ({
  clinicalServiceId: undefined as unknown as number,
  quantity: 1,
  notes: "",
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

export function HealthPlanForm({ setOpen, planId, onSuccess }: HealthPlanFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [selectedServices, setSelectedServices] = React.useState<(SelectedServiceInfo | undefined)[]>([
    undefined,
  ]);

  const schema = planId ? updateHealthPlanSchema : createHealthPlanSchema;

  const form = useForm<CreateHealthPlanRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      price: undefined as unknown as number,
      notes: "",
      serviceItems: [defaultServiceItem()],
    },
  });

  const { reset, control } = form;
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "serviceItems",
  });

  const initializeFromResponse = React.useCallback(
    (data: HealthPlanResponse) => {
      const preparedItems = data.serviceItems.map((item) => ({
        clinicalServiceId: item.clinicalServiceId,
        quantity: item.quantity,
        notes: item.notes ?? "",
      }));

      reset({
        name: data.name,
        description: data.description ?? "",
        price: data.price,
        notes: data.notes ?? "",
        serviceItems: preparedItems.length ? preparedItems : [defaultServiceItem()],
      });

      replace(preparedItems.length ? preparedItems : [defaultServiceItem()]);

      const selections = preparedItems.length
        ? preparedItems.map((item, index) => {
            const original = data.serviceItems[index];
            if (!original) return undefined;
            return {
              id: item.clinicalServiceId,
              label: original.clinicalServiceName,
              category: undefined,
              price: null,
            };
          })
        : [undefined];

      setSelectedServices(selections);
    },
    [reset, replace]
  );

  React.useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        if (planId) {
          const response = await HealthPlanService.getById(planId);
          if (active) {
            initializeFromResponse(response);
          }
        } else {
          reset({
            name: "",
            description: "",
            price: undefined as unknown as number,
            notes: "",
            serviceItems: [defaultServiceItem()],
          });
          replace([defaultServiceItem()]);
          setSelectedServices([undefined]);
        }
      } catch (error) {
        if (active) {
          toast({
            variant: "destructive",
            title: "Error",
            description: getAaxiosErrorMessage(error) ?? "No se pudo cargar el plan de salud.",
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
  }, [planId, initializeFromResponse, reset, replace, toast, setOpen]);

  const handleAddService = () => {
    append(defaultServiceItem());
    setSelectedServices((prev) => [...prev, undefined]);
  };

  const handleRemoveService = (index: number) => {
    remove(index);
    setSelectedServices((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next.length ? next : [undefined];
    });
  };

  const handleSelectService = (index: number, service: ClinicalServiceQuickSearchResponse) => {
    const label = service.name;
    setSelectedServices((prev) => {
      const next = [...prev];
      next[index] = {
        id: service.id,
        label,
        category: service.clinicalServiceCategory,
        price: service.price ?? null,
      };
      return next;
    });
    form.setValue(`serviceItems.${index}.clinicalServiceId`, service.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleClearService = (index: number) => {
    setSelectedServices((prev) => {
      const next = [...prev];
      next[index] = undefined;
      return next;
    });
    form.setValue(`serviceItems.${index}.clinicalServiceId`, undefined as unknown as number, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (values: CreateHealthPlanRequest) => {
    const payload: CreateHealthPlanRequest = {
      ...values,
      description: values.description?.trim() ? values.description.trim() : undefined,
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
      serviceItems: values.serviceItems.map((item) => ({
        clinicalServiceId: item.clinicalServiceId,
        quantity: item.quantity,
        notes: item.notes?.trim() ? item.notes.trim() : undefined,
      })),
    };

    try {
      if (planId) {
        const updated = await HealthPlanService.update(planId, payload);
        toast({
          variant: "default",
          title: "Plan actualizado",
          description: "El plan de salud fue actualizado correctamente.",
        });
        onSuccess?.(updated);
      } else {
        const created = await HealthPlanService.create(payload);
        toast({
          variant: "default",
          title: "Plan registrado",
          description: "El plan de salud fue creado correctamente.",
        });
        onSuccess?.(created);
        reset({
          name: "",
          description: "",
          price: undefined as unknown as number,
          notes: "",
          serviceItems: [defaultServiceItem()],
        });
        replace([defaultServiceItem()]);
        setSelectedServices([undefined]);
      }
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudo guardar el plan de salud.",
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
                      id="health-plan-name"
                      label="Nombre del plan"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="health-plan-description"
                      label="Descripción"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      id="health-plan-price"
                      type="number"
                      step="0.01"
                      label="Precio"
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
                      id="health-plan-notes"
                      placeholder="Notas adicionales del plan (opcional)"
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
                <h3 className="text-sm font-semibold">Servicios incluidos</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddService}
                  disabled={form.formState.isSubmitting}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir servicio
                </Button>
              </div>

              {fields.length === 0 && (
                <div className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Aún no has agregado servicios.
                </div>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-md border border-dashed border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">Servicio #{index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveService(index)}
                      disabled={form.formState.isSubmitting || fields.length === 1}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Quitar
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`serviceItems.${index}.clinicalServiceId`}
                    render={({ field: serviceField }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <input
                              type="hidden"
                              name={serviceField.name}
                              value={serviceField.value ?? ""}
                              ref={serviceField.ref}
                            />
                            <ServiceSelector
                              selectedService={selectedServices[index]}
                              onSelectService={(service) => handleSelectService(index, service)}
                              onClear={() => handleClearService(index)}
                              disabled={form.formState.isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`serviceItems.${index}.quantity`}
                      render={({ field: quantityField }) => (
                        <FormItem>
                          <FormControl>
                            <FloatingLabelInput
                              {...quantityField}
                              id={`serviceItems-${index}-quantity`}
                              type="number"
                              step="1"
                              label="Cantidad"
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`serviceItems.${index}.notes`}
                      render={({ field: notesField }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              id={`serviceItems-${index}-notes`}
                              placeholder="Notas del servicio (opcional)"
                              disabled={form.formState.isSubmitting}
                              value={notesField.value ?? ""}
                              onChange={(event) => notesField.onChange(event.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-48">
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {planId ? "Guardar cambios" : "Registrar plan"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}

export default HealthPlanForm;
