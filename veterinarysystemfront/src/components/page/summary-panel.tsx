import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Panel resumen de una pantalla de detalle: UNA sola superficie suave que reúne
 * los datos clave (en lugar de una card por dato). Dentro van SummaryItem.
 */
export function SummaryPanel({
  className,
  children,
  footer,
}: {
  className?: string;
  children: React.ReactNode;
  /** Texto largo (descripción/notas) separado por una línea. */
  footer?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border bg-muted/40", className)}>
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      {footer && <div className="border-t px-4 py-3 text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

export function SummaryItem({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon?: LucideIcon;
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-start gap-3", className)}>
      {Icon && (
        <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-background text-muted-foreground">
          <Icon className="size-4" />
        </span>
      )}
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-base font-semibold text-foreground">{children ?? "—"}</div>
      </div>
    </div>
  );
}
