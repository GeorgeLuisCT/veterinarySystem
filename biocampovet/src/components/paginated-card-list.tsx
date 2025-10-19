"use client";

import * as React from "react";
import { MoreHorizontal, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaginatedResponse } from "@/types/paginated-response";
import type { Action } from "./data-table";

interface PaginatedCardListProps<T> {
  pageData?: PaginatedResponse<T> | null;
  pageIndex: number;
  pageSize: number;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading: boolean;
  renderCard: (item: T) => React.ReactNode;
  actions?: Action<T>[];
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  headerSlotLeft?: React.ReactNode;
  headerSlotRight?: React.ReactNode;
  getItemKey?: (item: T) => string | number;
  cardHighlightBy?: (item: T) => boolean;
  cardHighlightClassName?: string;
  cardClassName?: string;
  emptyState?: React.ReactNode;
  onCardClick?: (item: T) => void;
}

export function PaginatedCardList<T>({
  pageData,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  loading,
  renderCard,
  actions = [],
  onSearch,
  searchPlaceholder,
  headerSlotLeft,
  headerSlotRight,
  getItemKey,
  cardHighlightBy,
  cardHighlightClassName,
  cardClassName,
  emptyState,
  onCardClick,
}: PaginatedCardListProps<T>) {
  const data = pageData?.content ?? [];
  const totalPages = Math.max(pageData?.totalPages ?? 1, 1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debounceTimeout, setDebounceTimeout] = React.useState<number | null>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSearch) return;

    const query = event.target.value;
    setSearchQuery(query);
    if (debounceTimeout) window.clearTimeout(debounceTimeout);

    const timeout = window.setTimeout(() => onSearch(query), 500);
    setDebounceTimeout(timeout);
  };

  React.useEffect(() => {
    return () => {
      if (debounceTimeout) window.clearTimeout(debounceTimeout);
    };
  }, [debounceTimeout]);

  const highlightClassDefault =
    "ring-2 ring-emerald-400/60 bg-emerald-50/80 animate-pulse transition-all";

  const isFromInteractive = (target: HTMLElement | null, currentTarget: HTMLElement) => {
    if (!target) return false;
    const interactive = target.closest(
      'button, a, [role="button"], input, textarea, select, summary, details, [contenteditable="true"], [data-card-action-ignore="true"]'
    );
    return !!interactive && interactive !== currentTarget;
  };

  const handleCardClick = (item: T, event: React.MouseEvent<HTMLDivElement>) => {
    if (!onCardClick) return;
    if (isFromInteractive(event.target as HTMLElement, event.currentTarget)) return;
    onCardClick(item);
  };

  return (
    <div className="w-full h-full rounded-lg text-foreground flex flex-col">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onSearch && (
            <Input
              placeholder={searchPlaceholder || "Buscar..."}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full sm:w-64"
            />
          )}
          {headerSlotLeft}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {headerSlotRight}
          <select
            className="border border-border rounded-md p-1 bg-background"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {data.length === 0 && !loading ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {emptyState ?? "No hay elementos para mostrar."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((item, index) => {
              const key = getItemKey ? getItemKey(item) : index;
              const highlighted = cardHighlightBy?.(item) ?? false;
              const clickable = !!onCardClick;
              const baseClass =
                "relative rounded-lg border border-border bg-background p-4 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70";
              const highlightClass = highlighted
                ? cardHighlightClassName ?? highlightClassDefault
                : "";

              const classes = `${baseClass} ${highlightClass} ${cardClassName ?? ""} ${
                clickable ? "cursor-pointer" : ""
              }`;

              const directActions = actions.filter((action) => action.type === "direct");
              const dropdownActions = actions.filter((action) => action.type !== "direct");

              return (
                <div
                  key={key}
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : -1}
                  onClick={(event) => handleCardClick(item, event)}
                  onKeyDown={(event) => {
                    if (!clickable) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onCardClick?.(item);
                    }
                  }}
                >
                  {(directActions.length > 0 || dropdownActions.length > 0) && (
                    <div className="absolute top-3 right-3 flex items-center gap-1" data-card-action-ignore="true">
                      {directActions.map((action, actionIndex) => (
                        <Button
                          key={`direct-${actionIndex}`}
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation();
                            action.onClick(item);
                          }}
                          aria-label={action.label}
                        >
                          {action.icon}
                        </Button>
                      ))}
                      {dropdownActions.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Acciones adicionales"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                            {dropdownActions.map((action, menuIndex) => (
                              <DropdownMenuItem
                                key={`dropdown-${menuIndex}`}
                                onClick={() => action.onClick(item)}
                                className="flex items-center gap-2"
                              >
                                {action.icon && <span className="w-4 h-4">{action.icon}</span>}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}

                  {renderCard(item)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          disabled={pageIndex === 0 || loading}
          onClick={() => onPageIndexChange(Math.max(pageIndex - 1, 0))}
        >
          Anterior
        </Button>
        <span>
          Página {pageIndex + 1} de {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={pageIndex + 1 >= totalPages || loading}
          onClick={() => onPageIndexChange(pageIndex + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

export default PaginatedCardList;
