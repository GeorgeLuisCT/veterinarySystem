"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Texto/badge a la derecha del título; útil para resumir el contenido cuando está cerrada ("3 registros"). */
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

/**
 * Sección colapsable plana (sin caja): una línea divisoria, título con chevron
 * y contenido que se muestra solo si el usuario lo abre.
 * Usar para agrupar información extensa (detalle, formularios largos).
 */
export function CollapsibleSection({
  title,
  description,
  summary,
  defaultOpen = true,
  className,
  contentClassName,
  children,
}: CollapsibleSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("border-b last:border-b-0", className)}>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {summary && <div className="shrink-0 text-sm text-muted-foreground">{summary}</div>}
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("pb-4", contentClassName)}>{children}</CollapsibleContent>
    </Collapsible>
  );
}
