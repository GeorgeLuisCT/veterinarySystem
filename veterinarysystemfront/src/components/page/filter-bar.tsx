import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Barra de filtros estándar: borde fino, fondo card, sin blur ni sombras.
 * Los controles van en una fila con scroll horizontal en pantallas pequeñas.
 */
export function FilterBar({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("w-full overflow-x-auto rounded-lg border bg-card p-3", className)}
      {...props}
    >
      <div className="flex min-w-max items-center gap-3">{children}</div>
    </div>
  );
}
