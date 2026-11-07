"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  "aria-label"?: string;
  className?: string;
};

/**
 * Selector de tipo con botones. Usar cuando se ELIGE entre opciones excluyentes
 * (p. ej. tipo de cita); para navegar entre vistas/secciones se siguen usando Tabs.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  ...rest
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={rest["aria-label"]}
      className={cn("grid gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(({ value: v, label, icon: Icon }) => {
        const selected = v === value;
        return (
          <Button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            variant={selected ? "default" : "outline"}
            onClick={() => onChange(v)}
            className="gap-2"
          >
            {Icon && <Icon />}
            {label}
          </Button>
        );
      })}
    </div>
  );
}
