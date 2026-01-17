"use client";

import * as React from "react";
import { X, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";

export type Option<T> = {
  label: string;
  value: T;
};

interface FloatingLabelSingleBadgeSelectProps<T> {
  id: string;
  label: string;
  options: Option<T>[];
  selected?: T;
  onChange: (selected: T | undefined) => void;
  className?: string;
  emptyMessage?: string;
  onSearch?: (query: string) => void;
}

export function FloatingLabelSingleBadgeSelect<T extends string | number | boolean>({
  id,
  label,
  options,
  selected,
  onChange,
  className,
  emptyMessage = "No se encontraron resultados.",
  onSearch,
}: FloatingLabelSingleBadgeSelectProps<T>) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const debounceRef = React.useRef<number>(0);

  const selectedOption = options.find((opt) => opt.value === selected);

  const handleUnselect = () => {
    onChange(undefined);
  };

  const handleSelect = (value: T) => {
    if (value === selected) {
      onChange(undefined);
    } else {
      onChange(value);
    }
    setOpen(false);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      onSearch?.(query);
    }, 500);
  };

  const hasValue = selected !== undefined;

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            tabIndex={0}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "flex min-h-9 w-full flex-wrap items-center justify-between rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
              isFocused ? "border-primary" : "",
              className
            )}
          >
            <div className="flex flex-wrap gap-1 flex-grow">
              {selectedOption ? (
                <Badge variant="secondary" className="mr-1">
                  {selectedOption.label}
                  <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUnselect();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={handleUnselect}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ) : (
                <></>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar..." value={searchQuery} onValueChange={handleSearchChange} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {options.map((option) => (
                  <CommandItem
                    key={String(option.value)}
                    value={option.label.toLowerCase()}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        selected === option.value ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 10 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 5L4 7L8 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Label
        htmlFor={id}
        className={cn(
          "absolute left-3 px-1 text-sm transition-all duration-200 pointer-events-none z-10",
          isFocused || hasValue
            ? "-top-2.5 text-xs text-primary bg-background"
            : "top-2.5 text-muted-foreground"
        )}
      >
        {label}
      </Label>
    </div>
  );
}