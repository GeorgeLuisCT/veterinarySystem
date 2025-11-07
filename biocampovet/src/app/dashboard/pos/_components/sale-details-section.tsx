// app/dashboard/pos/_components/sale-details-section.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ChevronsUpDown, Check, X, FileText, User, StickyNote } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { SalesDocumentType } from "../_types/sale-enums";
import { SaleFormValues } from "../_types/sale-request";
import CustomerService from "../../crm/customers/service/customer-service";
import { CustomerQuickSearchResponse } from "../../crm/customers/types/customer-quick-search-response";

type Props = {
  form: UseFormReturn<SaleFormValues>;
  isFinalized: boolean;
  isEditing: boolean;
  documentOptions: { value: SalesDocumentType; label: string }[];
  onHeaderUpdate: (values: SaleFormValues) => void;
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

  // --- Auto-guardado ---
  const watchedValues = watch();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isEditing || !isDirty || !isMounted.current) {
      if (!isMounted.current) isMounted.current = true;
      return;
    }

    const hasRelevantChange =
      dirtyFields.documentType ||
      dirtyFields.documentNumber ||
      dirtyFields.customerId ||
      dirtyFields.notes;

    if (!hasRelevantChange) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      onHeaderUpdate(watchedValues);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watchedValues, isEditing, isDirty, dirtyFields, onHeaderUpdate]);

  // --- ComboBox Cliente ---
  const selectedId = watch("customerId");

  useEffect(() => {
    let active = true;
    async function fetchExisting() {
      if (!selectedId) {
        setSelected(null);
        return;
      }
      if (selected && selected.id === selectedId) return;
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
    if (customerSearchDebounceRef.current) window.clearTimeout(customerSearchDebounceRef.current);

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
      if (customerSearchDebounceRef.current) window.clearTimeout(customerSearchDebounceRef.current);
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
    <Card className="surface-card h-60">
      <CardContent className="grid gap-4 md:grid-cols-24">
        {/* Tipo de comprobante (Select shadcn + icono) */}
        <div className="space-y-2 col-span-11">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Tipo de comprobante
          </Label>
          <div className="relative">
            <FileText className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/80" />
            <Select
              value={(watch("documentType") as string) ?? ""}
              onValueChange={(v) =>
                form.setValue("documentType", v as SalesDocumentType, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              disabled={isFinalized}
            >
              <SelectTrigger
                className={cn(
                  "w-full pl-9",
                  documentTypeErr && "border-destructive focus:ring-destructive"
                )}
              >
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {documentOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {documentTypeErr && <p className="text-xs text-destructive">{documentTypeErr}</p>}
        </div>

        {/* Cliente (Command + iconos) */}
        <div className="space-y-2 col-span-12">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Cliente
          </Label>
          <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={(v) => !isFinalized && setOpen(v)}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-between pl-9",
                    !customerDisplay && "text-muted-foreground",
                    customerIdErr && "border-destructive"
                  )}
                  disabled={isFinalized}
                >
                  <span className="truncate">{customerDisplay || "Buscar cliente..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[min(33rem,95vw)]">
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
                            <User className="h-4 w-4 opacity-80" />
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selected?.id === opt.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{opt.name}</span>
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                title="Quitar cliente"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <input type="hidden" {...form.register("customerId")} />
          {customerIdErr && <p className="text-xs text-destructive">{customerIdErr}</p>}
        </div>

        {/* Notas (Textarea + icono) */}
        <div className="space-y-2 col-span-23">
          <Label className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            Notas
          </Label>
          <div className="relative">
            <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-primary/80" />
            <Textarea
              {...form.register("notes", {
                onChange: (event) =>
                  form.setValue("notes", event.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  }),
              })}
              placeholder="Observaciones de la venta"
              disabled={isFinalized}
              className={cn("min-h-12 pl-9", notesErr && "border-destructive focus-visible:ring-destructive")}
            />
          </div>
          {notesErr && <p className="text-xs text-destructive">{notesErr}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
