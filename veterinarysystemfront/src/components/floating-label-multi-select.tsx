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

interface FloatingLabelMultiSelectProps<T> {
    id: string;
    label: string;
    options: Option<T>[];
    selected: T[];
    onChange: (selected: T[]) => void;
    className?: string;
    emptyMessage?: string;
    onSearch?: (query: string) => void;
}

export function FloatingLabelMultiSelect<T extends string | number | boolean>({
    id,
    label,
    options,
    selected,
    onChange,
    className,
    emptyMessage = "No se encontraron resultados.",
    onSearch,
}: FloatingLabelMultiSelectProps<T>) {
    const [isFocused, setIsFocused] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const debounceRef = React.useRef<number>(0);

    const [selectedOptions, setSelectedOptions] = React.useState<Option<T>[]>([]);

    React.useEffect(() => {
        setSelectedOptions((prevSelectedOptions) => {
            const combined = [...prevSelectedOptions];

            selected.forEach((val) => {
                const already = combined.find((opt) => opt.value === val);
                if (!already) {
                    const newOpt = options.find((opt) => opt.value === val);
                    if (newOpt) {
                        combined.push(newOpt);
                    }
                }
            });

            return combined.filter((opt) => selected.includes(opt.value));
        });
    }, [selected, options]);


    const hasValue = selected.length > 0;

    const handleUnselect = (value: T) => {
        onChange(selected.filter((item) => item !== value));
        setSelectedOptions((prev) => prev.filter((opt) => opt.value !== value));
    };

    const handleSelect = (value: T) => {
        const already = selected.includes(value);
        const option = options.find((o) => o.value === value);
        if (!option) return;

        if (already) {
            handleUnselect(value);
        } else {
            onChange([...selected, value]);
            setSelectedOptions((prev) => [...prev, option]);
        }
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            onSearch?.(query);
        }, 500);
    };

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
                            isFocused ? "border-primary" : "border-muted-foreground",
                            className
                        )}
                    >
                        <div className="flex flex-wrap gap-1 flex-grow">
                            {selectedOptions.map((option) => (
                                <Badge key={String(option.value)} variant="secondary" className="mr-1">
                                    {option.label}
                                    <button
                                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleUnselect(option.value);
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={() => handleUnselect(option.value)}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </Badge>
                            ))}
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
                                {options.map((option) => {
                                    const isSelected = selected.includes(option.value);
                                    return (
                                        <CommandItem
                                            key={String(option.value)}
                                            value={option.label.toLowerCase()}
                                            onSelect={() => handleSelect(option.value)}
                                        >
                                            <div
                                                className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
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
                                    );
                                })}
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
