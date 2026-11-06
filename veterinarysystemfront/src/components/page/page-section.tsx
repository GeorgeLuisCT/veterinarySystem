import * as React from "react";
import { cn } from "@/lib/utils";

type PageSectionProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Sección plana (sin caja): título + contenido sobre el fondo de la página.
 * Usar en lugar de <Card> cuando el contenido ya tiene su propio borde
 * (tablas) o cuando solo se agrupa visualmente. Evita cards dentro de cards.
 */
export function PageSection({ title, description, actions, className, children }: PageSectionProps) {
  return (
    <section className={cn("flex min-h-0 flex-col gap-3", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
