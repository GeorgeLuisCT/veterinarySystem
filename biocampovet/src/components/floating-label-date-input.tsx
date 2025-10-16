"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface FloatingLabelDateInputProps {
  label: string
  id: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export function FloatingLabelDateInput({
  label,
  id,
  value,
  onChange,
  disabled = false,
  className,
}: FloatingLabelDateInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [open, setOpen] = useState(false)

  const hasValue = !!value
  const floating = hasValue || isFocused || open

  const displayValue = value ? format(new Date(value), "PPP", { locale: es }) : ""

  return (
    <div className="relative mb-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "w-full rounded-md border text-left font-normal transition-all duration-200",
              floating ? "border-primary" : "border-muted-foreground",
              !displayValue && !disabled && "text-muted-foreground",
              className,
            )}
          >
            {displayValue || ""}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => {
              onChange?.(date?.toISOString().split("T")[0] ?? "")
              setOpen(false)
            }}
            locale={es}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Label
        htmlFor={id}
        className={cn(
          "absolute left-3 px-1 text-sm transition-all duration-200 pointer-events-none z-10",
          floating
            ? "-top-2.5 text-xs text-primary bg-background"
            : "top-2 text-xm text-muted-foreground"
        )}
      >
        {label}
      </Label>
    </div>
  )
}
