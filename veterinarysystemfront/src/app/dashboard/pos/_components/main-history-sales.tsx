"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SaleSummaryResponse } from "../_types/sale-response";
import SalesService from "../_service/sales.service";
import { Eye, Pencil } from "lucide-react";
import { getAaxiosErrorMessage } from "@/helpers/error";
import SalesFilters, { DEFAULTS, defaultDateRange, FiltersShape } from "./sales-history-filters";
import { Badge } from "@/components/ui/badge";
import { SalesDocumentTypeLabels, SaleStatus, SaleStatusLabels } from "../_types/sale-enums";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";
import { format } from "date-fns";
import { useSalesHistoryContext } from "../_hooks/sales-history-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Helpers
const toBackendDate = (date?: Date) =>
    date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : undefined;

const shallowEqualFilters = (a: FiltersShape, b: FiltersShape) => {
    const eq = (x: unknown, y: unknown) => x === y;
    const eqDate = (d1?: Date, d2?: Date) =>
        (!d1 && !d2) || (d1 && d2 && d1.getTime() === d2.getTime());

    return (
        eq(a.q, b.q) &&
        eq(a.branchId, b.branchId) &&
        eq(a.customerId, b.customerId) &&
        eq(a.sellerId, b.sellerId) &&
        eq(a.status, b.status) &&
        eq(a.documentType, b.documentType) &&
        eq(a.documentNumber, b.documentNumber) &&
        ((!a.dateRange && !b.dateRange) ||
            (a.dateRange &&
                b.dateRange &&
                eqDate(a.dateRange.from ?? undefined, b.dateRange.from ?? undefined) &&
                eqDate(a.dateRange.to ?? undefined, b.dateRange.to ?? undefined)))
    );
};

export default function MainSales() {
    const router = useRouter();
    const { sales, setSales } = useSalesHistoryContext();
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

    useEffect(() => {
        setFilters((current) => {
            const next: FiltersShape = { ...current, branchId: normalizedBranchId };
            return shallowEqualFilters(current, next) ? current : next;
        });
        setPageIndex(0);
    }, [normalizedBranchId]);

    const salesColumns: ColumnDef<SaleSummaryResponse>[] = useMemo(
        () => [
            {
                accessorKey: "documentNumber",
                header: "Comprobante",
                cell: ({ row }) => {
                    const s = row.original;
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium leading-tight">
                                {SalesDocumentTypeLabels[s.documentType]} {s.documentNumber && "-"} {s.documentNumber}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "customerName",
                header: "Cliente",
                cell: ({ row }) => row.original.customerName || "Consumidor Final",
            },
            {
                accessorKey: "grandTotal",
                header: "Total",
                cell: ({ row }) => `S/ ${row.original.grandTotal.toFixed(2)}`,
            },
            {
                accessorKey: "status",
                header: "Estado",
                cell: ({ row }) => {
                    const s = row.original;
                    let variant: "default" | "destructive" | "secondary" | "outline" = "secondary";
                    let extra = "";

                    if (s.status === SaleStatus.VOIDED) variant = "destructive";
                    if (s.status === SaleStatus.COMPLETED) {
                        variant = "secondary";
                        extra = "bg-success-soft text-success-strong";
                    }
                    if (s.status === SaleStatus.DRAFT) variant = "default";

                    return (
                        <Badge variant={variant} className={cn("rounded-full", extra)}>
                            {SaleStatusLabels[s.status]}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: "Fecha",
                cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
            },
        ],
        []
    );

    const salesActions: Action<SaleSummaryResponse>[] = [
        {
            label: "Ver",
            type: "direct",
            icon: <Eye className="w-4 h-4" />,
            onClick: (row) => router.push(`/dashboard/pos/sales/history/${row.id}`),
        },
        {
            label: "Editar",
            type: "direct",
            icon: <Pencil className="w-4 h-4" />,
            onClick: (row) => router.push(`/dashboard/pos/sales/new?saleId=${row.id}`),
            isVisible: (row) => row.status === SaleStatus.DRAFT,
        },
    ];

    const fetchSales = useCallback(
        async (page = 0, size = 10) => {
            setLoading(true);
            try {
                const startDate = filters.dateRange?.from
                    ? toBackendDate(filters.dateRange.from)
                    : undefined;
                const endDate = filters.dateRange?.to
                    ? toBackendDate(filters.dateRange.to)
                    : undefined;

                const response = await SalesService.listSales({
                    page,
                    size,
                    ...filters,
                    startDate,
                    endDate,
                });
                setSales(response);
            } catch (error: unknown) {
                const message = getAaxiosErrorMessage(error) || "Error al cargar las ventas";
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: message,
                });
            } finally {
                setLoading(false);
            }
        },
        [filters, setSales, toast]
    );

    useEffect(() => {
        fetchSales(pageIndex, pageSize);
    }, [fetchSales, pageIndex, pageSize]);

    return (
        <div className="h-full space-y-4">
            <SalesFilters
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

            <DataTable<SaleSummaryResponse>
                pageData={sales}
                columns={salesColumns}
                actions={salesActions}
                pageIndex={sales.currentPage}
                pageSize={sales.pageSize}
                onPageIndexChange={(p) => setPageIndex((prev) => (prev === p ? prev : p))}
                onPageSizeChange={(s) => {
                    setPageSize((prev) => (prev === s ? prev : s));
                    setPageIndex(0);
                }}
                loading={loading}
            // (Opcional) Si quieres click en fila para abrir Ver:
            // onRowClick={(row) => router.push(`/dashboard/sales/${row.id}`)}
            />
        </div>
    );
}
