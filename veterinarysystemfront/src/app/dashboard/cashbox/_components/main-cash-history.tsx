"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { CashSessionHistoryResponse } from "../_types/cash-session-response";
import CashSessionService from "../_service/cash-session.service";
import { Eye } from "lucide-react";
import { getAaxiosErrorMessage } from "@/helpers/error";
import CashHistoryFilters, { DEFAULTS, defaultDateRange, FiltersShape } from "./cash-history-filters";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";
import { format } from "date-fns";
import { useCashHistoryContext } from "../_hooks/cash-history-context";
import { useToast } from "@/hooks/use-toast";

// Helpers
const toBackendDate = (date?: Date) =>
  date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : undefined;

const shallowEqualFilters = (a: FiltersShape, b: FiltersShape) => {
  const eqDate = (d1?: Date, d2?: Date) =>
    (!d1 && !d2) || (d1 && d2 && d1.getTime() === d2.getTime());

  return (
    a.branchId === b.branchId &&
    a.cashierId === b.cashierId &&
    ((!a.dateRange && !b.dateRange) ||
      (a.dateRange &&
        b.dateRange &&
        eqDate(a.dateRange.from ?? undefined, b.dateRange.from ?? undefined) &&
        eqDate(a.dateRange.to ?? undefined, b.dateRange.to ?? undefined)))
  );
};

export default function MainCashHistory() {
  const router = useRouter();
  const { history, setHistory } = useCashHistoryContext();
  const { userInfo } = useUser();
  const { toast } = useToast();

  const selectedBranchId = userInfo?.selectedBranch?.id;
  const normalizedBranchId =
    selectedBranchId && selectedBranchId !== 0 ? selectedBranchId : undefined;

  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<FiltersShape>({
    ...DEFAULTS,
    branchId: normalizedBranchId,
    dateRange: defaultDateRange,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Sincronizar filtros con el contexto de sucursal
  useEffect(() => {
    setFilters((current) => {
      const next: FiltersShape = { ...current, branchId: normalizedBranchId };
      return shallowEqualFilters(current, next) ? current : next;
    });
    setPageIndex(0);
  }, [normalizedBranchId]);

  const historyColumns: ColumnDef<CashSessionHistoryResponse>[] = useMemo(
    () => [
      {
        accessorKey: "branchName",
        header: "Sucursal",
        cell: ({ row }) => row.original.branchName ?? row.original.branchId,
      },
      {
        accessorKey: "cashierName",
        header: "Cajero",
        cell: ({ row }) => row.original.cashierName ?? row.original.cashierId,
      },
      {
        accessorKey: "openedAt",
        header: "Apertura",
        cell: ({ row }) => new Date(row.original.openedAt).toLocaleString(),
      },
      {
        accessorKey: "closedAt",
        header: "Cierre",
        cell: ({ row }) => (row.original.closedAt ? new Date(row.original.closedAt).toLocaleString() : "—"),
      },
      {
        accessorKey: "calculatedClosingAmount",
        header: "Calculado",
        cell: ({ row }) => `S/ ${row.original.calculatedClosingAmount.toFixed(2)}`,
      },
      {
        accessorKey: "countedClosingAmount",
        header: "Contado",
        cell: ({ row }) => `S/ ${(row.original.countedClosingAmount ?? 0).toFixed(2)}`,
      },
      {
        accessorKey: "differenceAmount",
        header: "Diferencia",
        cell: ({ row }) => {
          const diff = row.original.differenceAmount ?? 0;
          const diffClass = diff !== 0 ? "text-destructive" : "";
          return <span className={diffClass}>S/ {diff.toFixed(2)}</span>;
        },
      },
    ],
    []
  );

  const historyActions: Action<CashSessionHistoryResponse>[] = [
    {
      label: "Ver Detalle",
      type: "direct",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => router.push(`/dashboard/cashbox/history/${row.id}`),
    },
  ];

  const fetchHistory = useCallback(
    async (page = 0, size = 10) => {
      setLoading(true);
      try {
        const startDate = filters.dateRange?.from
          ? toBackendDate(filters.dateRange.from)
          : undefined;
        const endDate = filters.dateRange?.to
          ? toBackendDate(filters.dateRange.to)
          : undefined;

        const response = await CashSessionService.listHistory({
          page,
          size,
          ...filters,
          startDate,
          endDate,
        });
        setHistory(response);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al cargar el historial";
        toast({
          variant: "destructive",
          title: "Error",
          description: message,
        });
      } finally {
        setLoading(false);
      }
    },
    [filters, setHistory, toast]
  );

  // Re-cargar datos cuando cambian filtros o paginación
  useEffect(() => {
    fetchHistory(pageIndex, pageSize);
  }, [fetchHistory, pageIndex, pageSize]);

  return (
    <div className="h-full space-y-4">
      <CashHistoryFilters
        value={filters}
        onChange={(f) => {
          setFilters((prev) => (shallowEqualFilters(prev, f) ? prev : f));
          setPageIndex(0);
        }}
        onReset={() => {
          const next: FiltersShape = {
            ...DEFAULTS,
            branchId: normalizedBranchId,
            dateRange: defaultDateRange,
          };
          setFilters((prev) => (shallowEqualFilters(prev, next) ? prev : next));
          setPageIndex(0);
        }}
      />

      <DataTable<CashSessionHistoryResponse>
        pageData={history}
        columns={historyColumns}
        actions={historyActions}
        pageIndex={history.currentPage}
        pageSize={history.pageSize}
        onPageIndexChange={(p) => setPageIndex((prev) => (prev === p ? prev : p))}
        onPageSizeChange={(s) => {
          setPageSize((prev) => (prev === s ? prev : s));
          setPageIndex(0);
        }}
        loading={loading}
        onRowClick={(row) => router.push(`/dashboard/cashbox/history/${row.id}`)}
      />
    </div>
  );
}