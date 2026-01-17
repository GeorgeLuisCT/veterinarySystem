"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SearchPopoverProps<T> {
  selected: T | null;
  onSelect: (option: T) => void;
  placeholder?: string;
  emptyMessage?: string;
  search: (query: string) => void;
  cancel: () => void;
  options: T[];
  loading: boolean;
  getOptionLabel: (option: T) => string;
  getOptionDescription?: (option: T) => string | undefined;
  onClosed?: () => void;
}

export function SearchPopover<T>({
  selected,
  onSelect,
  placeholder,
  emptyMessage,
  search,
  cancel,
  options,
  loading,
  getOptionLabel,
  getOptionDescription,
  onClosed,
}: SearchPopoverProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    search(query);
    return cancel;
  }, [cancel, query, search]);

  useEffect(() => {
    if (!open) {
      cancel();
      setQuery("");
      onClosed?.();
    }
  }, [cancel, onClosed, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">
            {selected ? getOptionLabel(selected) : placeholder ?? "Seleccionar"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Buscar..." value={query} onValueChange={setQuery} className="h-9" />
          <CommandList>
            {loading && (
              <div className="py-4 text-center text-sm text-muted-foreground">Buscando…</div>
            )}
            {!loading && options.length === 0 && (
              <CommandEmpty>{emptyMessage ?? "Sin resultados"}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => {
                const label = getOptionLabel(option);
                const description = getOptionDescription?.(option);
                const isSelected = selected ? label === getOptionLabel(selected) : false;

                return (
                  <CommandItem
                    key={label}
                    value={label}
                    onSelect={() => {
                      onSelect(option);
                      setOpen(false);
                    }}
                    className="flex items-start justify-between"
                  >
                    <div className="flex flex-col text-left">
                      <span>{label}</span>
                      {description && (
                        <span className="text-xs text-muted-foreground">{description}</span>
                      )}
                    </div>
                    <Check className={cn("ml-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
