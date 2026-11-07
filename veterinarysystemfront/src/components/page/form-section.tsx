"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Columnas de la grilla de campos en pantallas ≥ sm (default 2). */
  cols?: 1 | 2 | 3;
  /** Sección opcional/avanzada: queda cerrada hasta que el usuario la abre. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
};

const COLS = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" } as const;

/**
 * Agrupa los campos de un formulario largo bajo un título.
 * Usar en cualquier formulario con más de ~6 campos.
 */
export function FormSection({
  title,
  description,
  cols = 2,
  collapsible = false,
  defaultOpen = true,
  className,
  children,
}: FormSectionProps) {
  const heading = (
    <div className="min-w-0 text-left">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
  const fields = <div className={cn("grid gap-4", COLS[cols])}>{children}</div>;

  if (!collapsible) {
    return (
      <section className={cn("space-y-3", className)}>
        {heading}
        {fields}
      </section>
    );
  }

  return (
    <Collapsible defaultOpen={defaultOpen} asChild>
      <section className={cn("space-y-3", className)}>
        <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          {heading}
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>{fields}</CollapsibleContent>
      </section>
    </Collapsible>
  );
}
