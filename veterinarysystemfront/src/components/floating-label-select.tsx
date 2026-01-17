"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover"
import {
    Command,
    CommandInput,
    CommandList,
    CommandItem,
    CommandEmpty,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"

interface Option {
    value: string
    label: string
}

interface FloatingLabelSelectProps {
    label: string
    id: string
    value?: string
    onValueChange: (value: string) => void
    options: Option[]
    placeholder?: string
    disabled?: boolean
    className?: string
    emptyMessage?: string
    onSearch?: (query: string) => void
}

export function FloatingLabelSelect({
    label,
    id,
    value = "",
    onValueChange,
    options,
    disabled = false,
    className,
    emptyMessage = "No se encontraron resultados.",
    onSearch,
}: FloatingLabelSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isFocused, setIsFocused] = React.useState(false)
    const debounceRef = React.useRef<number>(0)

    const handleSearchChange = (query: string) => {
        setSearchQuery(query)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = window.setTimeout(() => {
            onSearch?.(query)
        }, 500)
    }

    const selectedLabel = options.find(opt => opt.value === value)?.label || ""
    const hasValue = value !== null && value !== undefined && value !== "" && value !== "0"

    function parseAsterisks(text: string) {
        const parts = text.split(/(\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith("*") && part.endsWith("*")) {
                return <strong key={i}>{part.slice(1, -1)}</strong>;
            }
            return part;
        });
    }

    return (
        <div className="relative w-full mb-1">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div
                        role="combobox"
                        tabIndex={0}
                        aria-expanded={open}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={cn(
                            "flex min-h-9 w-full items-center justify-between rounded-md border px-3 text-sm bg-background",
                            isFocused ? "border-primary" : "border-muted-foreground",
                            disabled && "opacity-50 pointer-events-none",
                            className
                        )}
                    >
                        <span className={cn("truncate", !value && "text-muted-foreground")}>
                            {parseAsterisks(selectedLabel)}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput
                            value={searchQuery}
                            onValueChange={handleSearchChange}
                            placeholder="Buscar..."
                        />
                        <CommandList>
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onValueChange(option.value)
                                        setOpen(false)
                                        setSearchQuery("")
                                    }}
                                >
                                    {parseAsterisks(option.label)}
                                </CommandItem>
                            ))}
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
    )
}
