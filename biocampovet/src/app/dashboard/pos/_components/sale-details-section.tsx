// app/dashboard/pos/_components/sale-details-section.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { SalesDocumentType } from "../_types/sale-enums";
import { SaleFormValues } from "../_types/sale-request";
import CustomerService from "../../crm/customers/service/customer-service";
import { CustomerQuickSearchResponse } from "../../crm/customers/types/customer-quick-search-response";

type Props = {
  form: UseFormReturn<SaleFormValues>;
  isFinalized: boolean;
  isEditing: boolean; // Necesario para saber cuándo auto-guardar
  documentOptions: { value: SalesDocumentType; label: string }[];
  onHeaderUpdate: (values: SaleFormValues) => void; // Callback para auto-guardar
};

type CustomerOption = {
  id: number;
  name: string;
};

export default function SaleDetailsSection({
  form,
  isFinalized,
  isEditing,
  documentOptions,
  onHeaderUpdate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [selected, setSelected] = useState<CustomerOption | null>(null);

  const {
    watch,
    formState: { errors, isDirty, dirtyFields },
  } = form;

  // --- Lógica de Auto-guardado ---
  const watchedValues = watch();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isEditing || !isDirty || !isMounted.current) {
      if (!isMounted.current) {
        isMounted.current = true;
      }
      return;
    }

    const hasRelevantChange =
      dirtyFields.documentType ||
      dirtyFields.documentNumber ||
      dirtyFields.customerId ||
      dirtyFields.notes;

    if (!hasRelevantChange) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      // Solo llama a actualizar si el formulario es válido (opcional pero recomendado)
      // if (form.formState.isValid) {
      onHeaderUpdate(watchedValues);
      // }
    }, 400); // 400ms de debounce

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [watchedValues, isEditing, isDirty, dirtyFields, onHeaderUpdate]);

  // --- Lógica del ComboBox de Cliente ---
  const selectedId = watch("customerId");

  useEffect(() => {
    let active = true;
    async function fetchExisting() {
      if (!selectedId) {
        setSelected(null);
        return;
      }
      // Evitar fetch si el nombre ya está cargado
      if (selected && selected.id === selectedId) {
        return;
      }
      try {
        const data = await CustomerService.getCustomer(selectedId);
        if (!active) return;
        setSelected({ id: data.id, name: data.name });
      } catch {
        if (!active) return;
        setSelected(null);
      }
    }
    fetchExisting();
    return () => {
      active = false;
    };
  }, [selectedId, selected]);

  const customerSearchDebounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!open) return;
    if (customerSearchDebounceRef.current)
      window.clearTimeout(customerSearchDebounceRef.current);

    customerSearchDebounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const data = await CustomerService.searchCustomers(query.trim());
        const options: CustomerOption[] = (data ?? []).map((c: CustomerQuickSearchResponse) => ({
          id: c.id,
          name: c.name,
        }));
        setResults(options);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (customerSearchDebounceRef.current)
        window.clearTimeout(customerSearchDebounceRef.current);
    };
  }, [query, open]);

  const handleSelect = (opt: CustomerOption) => {
    setSelected(opt);
    form.setValue("customerId", opt.id, { shouldValidate: true, shouldDirty: true });
    setOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    form.setValue("customerId", undefined, { shouldValidate: true, shouldDirty: true });
  };

  const customerDisplay = useMemo(() => {
    if (selected) return selected.name;
    if (selectedId) return `Cargando... #${selectedId}`;
    return "";
  }, [selected, selectedId]);

  // --- Errores ---
  const documentTypeErr = errors.documentType?.message as string | undefined;
  const documentNumberErr = errors.documentNumber?.message as string | undefined;
  const customerIdErr = errors.customerId?.message as string | undefined;
  const notesErr = errors.notes?.message as string | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">1. Detalles de la venta</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Tipo de comprobante</Label>
          <div className="relative">
            <select
              className={cn(
                "w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
                documentTypeErr && "border-destructive focus:ring-destructive"
              )}
              {...form.register("documentType", {
                onChange: (e) =>
                  form.setValue("documentType", e.target.value as SalesDocumentType, {
                    shouldValidate: true,
                    shouldDirty: true,
                  }),
              })}
              disabled={isFinalized}
            >
              <option value="" disabled>
                Selecciona
              </option>
              {documentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
          </div>
          {documentTypeErr && <p className="text-xs text-destructive">{documentTypeErr}</p>}
        </div>

        <div className="space-y-2">
          <Label>Número de comprobante</Label>
          <Input
            {...form.register("documentNumber", {
              onChange: (e) =>
                form.setValue("documentNumber", e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                }),
            })}
            placeholder="Serie - Número"
            disabled={isFinalized}
            className={cn(documentNumberErr && "border-destructive focus-visible:ring-destructive")}
          />
          {documentNumberErr && <p className="text-xs text-destructive">{documentNumberErr}</p>}
        </div>

        <div className="space-y-2">
          <Label>Cliente</Label>
          <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={(v) => !isFinalized && setOpen(v)}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-between",
                    !customerDisplay && "text-muted-foreground",
                    customerIdErr && "border-destructive"
                  )}
                  disabled={isFinalized}
                >
                  <span className="truncate">{customerDisplay || "Buscar cliente..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[min(28rem,90vw)]">
                <Command shouldFilter={false}>
                  <CommandInput
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Escribe nombre o razón social…"
                  />
                  <CommandList>
                    {loading ? (
                      <CommandEmpty>Buscando…</CommandEmpty>
                    ) : results.length === 0 ? (
                      <CommandEmpty>Sin resultados</CommandEmpty>
                    ) : (
                      <CommandGroup heading="Coincidencias">
                        {results.map((opt) => (
                          <CommandItem
                            key={opt.id}
                            value={`${opt.id}`}
                            onSelect={() => handleSelect(opt)}
                            className="flex items-center gap-2"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selected?.id === opt.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{opt.name}</span>
                              <span className="text-xs text-muted-foreground">ID: {opt.id}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedId && !isFinalized && (
              <Button type="button" variant="ghost" size="icon" onClick={handleClear} title="Quitar cliente">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <input type="hidden" {...form.register("customerId")} />
          {customerIdErr && <p className="text-xs text-destructive">{customerIdErr}</p>}
        </div>

        <div className="md:col-span-3 space-y-2">
          <Label>Notas</Label>
          <Input
            {...form.register("notes", {
              onChange: (event) =>
                form.setValue("notes", event.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                }),
            })}
            placeholder="Observaciones de la venta"
            disabled={isFinalized}
            className={cn(notesErr && "border-destructive focus-visible:ring-destructive")}
          />
          {notesErr && <p className="text-xs text-destructive">{notesErr}</p>}
        </div>
      </CardContent>
    </Card>
  );
}