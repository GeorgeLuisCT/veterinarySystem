import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Contenedor estándar de toda pantalla del dashboard.
 * Define padding y ancho máximo únicos. No pinta fondo propio: el lienzo lo
 * da el layout (SidebarInset).
 */
export function PageContainer({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6" {...props}>
      <div className={cn("mx-auto flex h-full w-full max-w-screen-2xl flex-col gap-4", className)}>
        {children}
      </div>
    </div>
  );
}
