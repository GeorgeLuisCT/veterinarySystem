import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Lista etiqueta/valor para pantallas de detalle. Reemplaza las pilas de
 * cards con pares "etiqueta: valor".
 */
export function DescriptionList({
  cols = 3,
  className,
  children,
}: {
  cols?: 1 | 2 | 3 | 4;
  className?: string;
  children: React.ReactNode;
}) {
  const grid = {
    1: "",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[cols];
  return <dl className={cn("grid gap-x-6 gap-y-3", grid, className)}>{children}</dl>;
}

export function DescriptionItem({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{children ?? "—"}</dd>
    </div>
  );
}
