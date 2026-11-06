import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Botones / acciones de la derecha. */
  actions?: React.ReactNode;
  /** Si se indica, muestra un enlace "volver" sobre el título (pantallas de detalle). */
  backHref?: string;
  backLabel?: string;
  /** Chips/badges bajo el título (estado, fecha, etc.). */
  meta?: React.ReactNode;
  className?: string;
};

/**
 * Encabezado estándar de pantalla: título 2xl semibold + descripción sm muted
 * a la izquierda, acciones a la derecha.
 */
export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Volver",
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1 basis-80 space-y-1">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {meta && <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>}
      </div>
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
