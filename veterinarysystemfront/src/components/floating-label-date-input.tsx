"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Input } from "@/components/ui/input"

type DateInputMode = "auto" | "date" | "datetime"

interface FloatingLabelDateInputProps {
  label: string
  id: string
  value?: string // 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss'
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
  mode?: DateInputMode // controla si se muestra hora: "date" | "datetime" | "auto" (por defecto)
}

function parseValueToParts(v?: string) {
  if (!v) return { date: undefined as Date | undefined, time: "" }
  const s = v.trim()
  const [datePart, timePartRaw] = s.split("T")
  const [yyyy, mm, dd] = (datePart || "").split("-").map(Number)
  let time = ""
  if (timePartRaw) {
    const [hh, mi] = timePartRaw.slice(0, 5).split(":")
    if (hh && mi) time = `${hh}:${mi}`
  }
  if (!yyyy || !mm || !dd) return { date: undefined as Date | undefined, time }
  return { date: new Date(yyyy, (mm - 1), dd, 0, 0, 0, 0), time }
}

function toNaiveIsoLocal(dateObj?: Date, timeStr?: string) {
  if (!dateObj) return ""
  const [hhStr = "00", miStr = "00"] = (timeStr || "00:00").split(":")
  const yyyy = dateObj.getFullYear()
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0")
  const dd = String(dateObj.getDate()).padStart(2, "0")
  const hh = String(Number(hhStr) || 0).padStart(2, "0")
  const mi = String(Number(miStr) || 0).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00`
}

function toDateOnly(dateObj?: Date) {
  if (!dateObj) return ""
  const yyyy = dateObj.getFullYear()
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0")
  const dd = String(dateObj.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function FloatingLabelDateInput({
  label,
  id,
  value,
  onChange,
  disabled = false,
  className,
  mode = "auto",
}: FloatingLabelDateInputProps) {
  const initial = useMemo(() => parseValueToParts(value), [value])
  const [open, setOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initial.date)
  const [selectedTime, setSelectedTime] = useState<string>(initial.time)

  const showTime = useMemo<boolean>(() => {
    if (mode === "datetime") return true
    if (mode === "date") return false
    return !!value && value.includes("T")
  }, [mode, value])

  useEffect(() => {
    const p = parseValueToParts(value)
    setSelectedDate(p.date)
    setSelectedTime(p.time)
  }, [value])

  const handleOpenChange = (o: boolean) => {
    if (o) {
      const now = new Date()
      if (!selectedDate) setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      if (showTime && !selectedTime) {
        const hh = String(now.getHours()).padStart(2, "0")
        const mi = String(now.getMinutes()).padStart(2, "0")
        setSelectedTime(`${hh}:${mi}`)
      }
    }
    setOpen(o)
  }

  const hasValue = !!value
  const floating = hasValue || isFocused || open

  const displayValue = useMemo(() => {
    if (!value) return ""
    const { date, time } = parseValueToParts(value)
    if (!date) return ""
    try {
      const niceDate = format(date, "PPP", { locale: es })
      return showTime && time ? `${niceDate}, ${time}` : niceDate
    } catch {
      return value
    }
  }, [value, showTime])

  const handleApply = () => {
    const out = showTime
      ? toNaiveIsoLocal(selectedDate, selectedTime)
      : toDateOnly(selectedDate)
    onChange?.(out || "")
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedDate(undefined)
    setSelectedTime("")
    onChange?.("")
    setOpen(false)
  }

  return (
    <div className="relative mb-1">
      <Popover open={open} onOpenChange={handleOpenChange}>
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
              "flex items-center justify-between",
              className,
            )}
          >
            <span className="truncate">{displayValue || ""}</span>
            <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              defaultMonth={selectedDate ?? new Date()}
              initialFocus
            />

            {showTime && (
              <div className="mt-2 flex items-center gap-2 px-1">
                <Label htmlFor={`${id}-time`} className="text-xs text-muted-foreground">Hora</Label>
                <Input
                  id={`${id}-time`}
                  type="time"
                  step={60}
                  value={selectedTime || ""}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-[130px] h-8"
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-end gap-2 px-1 pb-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                Limpiar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={!selectedDate}
              >
                Listo
              </Button>
            </div>
          </div>
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
