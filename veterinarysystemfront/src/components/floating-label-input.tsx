"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FloatingLabelInputProps {
    label: string
    id: string
    value?: string | number
    onChange?: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    type?: string
    step?: string | number
}

export function FloatingLabelInput({
    label,
    id,
    value = "",
    onChange,
    placeholder = "",
    disabled = false,
    className,
    type = "text",
    step,
}: FloatingLabelInputProps) {
    const [isFocused, setIsFocused] = useState(false)

    const hasValue = value !== "" && value !== null && value !== undefined

    return (
        <div className="relative mb-1">
            <Input
                id={id}
                type={type}
                step={step}
                value={value?.toString() ?? ""}
                placeholder={placeholder}
                onChange={(e) => onChange?.(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={disabled}
                className={cn(
                    "w-full rounded-md border transition-all duration-200 focus:outline-none",
                    isFocused ? "border-primary" : "border-muted-foreground",
                    className,
                )}
            />
            <Label
                htmlFor={id}
                className={cn(
                    "absolute left-3 px-1 text-sm transition-all duration-200 pointer-events-none z-10",
                    hasValue
                        ? "-top-2.5 text-xs text-primary bg-background"
                        : "top-2 text-xm text-muted-foreground"
                )}
            >
                {label}
            </Label>
        </div>
    )
}
