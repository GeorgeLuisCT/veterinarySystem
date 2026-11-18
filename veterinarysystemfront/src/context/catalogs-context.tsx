"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { setCatalogStore } from "@/lib/catalogs";
import CatalogService from "@/services/catalog-service";

/**
 * Carga los catálogos editables (especies, vías de administración…) una vez al entrar al panel, antes de pintar las pantallas,
 * para que los textos aparezcan ya con los nombres configurados. Si la carga falla, la app sigue con los valores por defecto.
 */
export function CatalogsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    CatalogService.allItems()
      .then((data) => setCatalogStore(data))
      .catch(() => {
        // Sin catálogos del servidor se usan los valores por defecto del código.
      })
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando…
      </div>
    );
  }
  return <>{children}</>;
}
