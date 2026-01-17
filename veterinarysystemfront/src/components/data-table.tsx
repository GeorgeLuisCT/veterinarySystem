"use client";

import { useState } from "react";
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from "@tanstack/react-table";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaginatedResponse } from "@/types/paginated-response";
import type React from "react";

type ActionType = "direct" | "dropdown";

export interface Action<T> {
  label: string;
  onClick: (row: T) => void;
  icon?: React.ReactNode;
  type?: ActionType;
  isVisible?: (row: T) => boolean;
  isDisabled?: (row: T) => boolean;
}

interface DataTableProps<T> {
  pageData?: PaginatedResponse<T> | null;
  columns: ColumnDef<T>[];
  pageIndex: number;
  pageSize: number;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  actions?: Action<T>[];
  onSearch?: (searchQuery: string) => void;
  loading: boolean;
  headerSlotLeft?: React.ReactNode;
  headerSlotRight?: React.ReactNode;
  searchPlaceholder?: string;
  getRowKey?: (row: T) => string | number;
  rowHighlightBy?: (row: T) => boolean;
  rowHighlightClassName?: string;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  pageData,
  columns,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  actions = [],
  onSearch,
  loading,
  headerSlotLeft,
  headerSlotRight,
  searchPlaceholder,
  getRowKey,
  rowHighlightBy,
  rowHighlightClassName,
  emptyState,
  onRowClick,
}: DataTableProps<T>) {
  const data = pageData?.content ?? [];
  const totalPages = Math.max(pageData?.totalPages ?? 1, 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceTimeout, setDebounceTimeout] = useState<number | null>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSearch) return;

    const query = event.target.value;
    setSearchQuery(query);
    if (debounceTimeout) clearTimeout(debounceTimeout);

    const newTimeout = window.setTimeout(() => onSearch(query), 500);
    setDebounceTimeout(newTimeout);
  };

  const table = useReactTable({
    data,
    columns: [
      ...columns,
      ...(actions.length > 0
        ? [
          {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
              const rowData = row.original as T;

              // Filtra por visibilidad y tipo
              const visibleActions = actions.filter((a) =>
                a.isVisible ? a.isVisible(rowData) : true
              );
              const directActions = visibleActions.filter((a) => a.type === "direct");
              const dropdownActions = visibleActions.filter((a) => a.type !== "direct");

              const stop = (e: React.MouseEvent) => e.stopPropagation();

              return (
                <div className="flex items-center justify-center gap-1">
                  {directActions.map((action, index) => {
                    const disabled = action.isDisabled ? action.isDisabled(rowData) : false;
                    return (
                      <Button
                        key={index}
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (disabled) return;
                          action.onClick(rowData);
                        }}
                        disabled={disabled}
                        aria-disabled={disabled}
                        aria-label={action.label}
                        title={action.label}
                      >
                        {action.icon}
                      </Button>
                    );
                  })}

                  {dropdownActions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild className="cursor-pointer" onClick={stop}>
                        <Button variant="ghost" size="icon" onClick={stop} aria-label="Más acciones">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={stop}>
                        {dropdownActions.map((action, index) => {
                          const disabled = action.isDisabled ? action.isDisabled(rowData) : false;
                          return (
                            <DropdownMenuItem
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (disabled) return;
                                action.onClick(rowData);
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                              disabled={disabled}
                            >
                              {action.icon && <span className="w-4 h-4">{action.icon}</span>}
                              {action.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            },
          } as ColumnDef<T>,
        ]
        : []),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const highlightClassDefault =
    "bg-emerald-50 ring-2 ring-emerald-400/60 animate-pulse transition-all";

  const colSpan = columns.length + (actions.length > 0 ? 1 : 0);
  
  const isFromInteractive = (target: HTMLElement | null, currentTarget: HTMLElement) => {
    if (!target) return false;
    const interactive = target.closest(
      'button, a, [role="button"], input, textarea, select, summary, details, [contenteditable="true"], [data-row-action-ignore="true"]'
    );
    return !!interactive && interactive !== currentTarget;
  };

  const handleRowClick = (rowData: T) => {
    if (onRowClick) onRowClick(rowData);
  };
  
  return (
    <div className="w-full h-full rounded-lg text-foreground flex flex-col dark:bg-gray-900 dark:border-gray-800">
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
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
            }}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-border relative max-h-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        <Table className="w-full max-h-full">
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`p-2 ${header.column.id === "actions" ? "w-[120px] text-center" : ""}`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className="max-h-full">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const original = row.original as T;
                const key = getRowKey ? getRowKey(original) : row.id;
                const highlighted = rowHighlightBy?.(original) ?? false;

                const clickable = !!onRowClick;
                const rowClasses = `
                  border-b border-border last:border-0
                  ${highlighted ? (rowHighlightClassName ?? highlightClassDefault) : ""}
                  ${clickable ? "cursor-pointer hover:bg-muted/50 focus:bg-muted/60" : ""}
                `;

                return (
                  <TableRow
                    key={key}
                    className={rowClasses}
                    tabIndex={clickable ? 0 : -1}
                    role={clickable ? "button" : undefined}
                    onClick={(e) => {
                      if (!clickable) return;
                      if (isFromInteractive(e.target as HTMLElement, e.currentTarget as HTMLElement))
                        return;
                      handleRowClick(original);
                    }}
                    onKeyDown={(e) => {
                      if (!clickable) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowClick(original);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="pl-2 pt-0 pr-0 pb-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center p-6">
                  {emptyState ?? "No hay datos disponibles."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-between items-center mt-4">
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