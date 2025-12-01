"use client";

import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginatedListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  pageIndex: number;
  pageSize: number;
  totalElements?: number | null;
  totalPages?: number | null;
  onPageIndexChange: (pageIndex: number) => void;
  isBusy?: boolean;
  className?: string;
  listClassName?: string;
  getItemKey?: (item: T, index: number) => string | number;
  emptyState?: ReactNode;
  loadingState?: ReactNode;
  pageLabel?: string;
};

export default function PaginatedList<T>({
  items,
  renderItem,
  pageIndex,
  pageSize,
  totalElements,
  totalPages,
  onPageIndexChange,
  isBusy = false,
  className,
  listClassName,
  getItemKey,
  emptyState,
  loadingState,
  pageLabel,
}: PaginatedListProps<T>) {
  const showEmptyState = !isBusy && items.length === 0;
  const computedTotalPages = typeof totalPages === "number" ? Math.max(totalPages, 0) : 0;
  const start = pageIndex * pageSize + 1;
  const end = start + items.length - 1;
  const hasTotalElements = typeof totalElements === "number" && totalElements > 0;
  const canShowRange = hasTotalElements && items.length > 0;
  const derivedLabel =
    pageLabel ??
    (canShowRange
      ? `Mostrando ${start} - ${Math.min(end, totalElements as number)} de ${totalElements}`
      : `Página ${pageIndex + 1}${computedTotalPages ? ` de ${computedTotalPages}` : ""}`);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        {isBusy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
            {loadingState ?? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
        )}

        {showEmptyState ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/40 p-8 text-center text-sm text-muted-foreground">
            {emptyState ?? "No hay elementos para mostrar."}
          </div>
        ) : (
          <div className={cn("flex flex-col gap-4", listClassName)}>
            {items.map((item, index) => (
              <div key={getItemKey ? getItemKey(item, index) : index}>{renderItem(item, index)}</div>
            ))}
          </div>
        )}
      </div>


      <div className="flex flex-col gap-3 rounded-lg border bg-background px-4 py-3 text-sm text-foreground shadow-sm md:flex-row md:items-center md:justify-between">
        <span className="text-muted-foreground">{derivedLabel}</span>

        <div className="flex w-full justify-end gap-2 md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageIndexChange(Math.max(pageIndex - 1, 0))}
            disabled={pageIndex === 0 || isBusy}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageIndexChange(pageIndex + 1)}
            disabled={isBusy || (computedTotalPages > 0 && pageIndex + 1 >= computedTotalPages)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
