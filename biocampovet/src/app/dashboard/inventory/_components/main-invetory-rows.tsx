import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Box, Tag, List } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { ProductSummaryResponse, SaleModeSummary } from "../_types/product-response";
import { getProductUnitTypeLabelByQuantity, ProductUnitType } from "../_enums/product-unit-type";
import { getProductPresentationTypeLabel, getProductPresentationTypeLabelByQuantity } from "../_enums/product-presentation-type";
import { AdministrationRouteLabels } from "../_enums/administration-route";
import { getSaleModeSummaryText } from "../_utils/product-util-labels";
import { presentationToUnitMap } from "../_helpers/product-mapper";
import { formatPresentation } from "../_helpers/product-formatters";

const currency = (n: number | string) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 2 }).format(Number(n));

export const useInventoryColumns = (branchId: number) => {
    const inventoryColumns: ColumnDef<ProductSummaryResponse>[] = useMemo(() => {
        const cols: ColumnDef<ProductSummaryResponse>[] = [
            {
                accessorKey: "name",
                header: "Producto",
                cell: ({ row }) => {
                    const p = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                                <Box className="h-4 w-4 text-zinc-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium leading-tight">{p.name}</span>
                                <span className="text-xs text-muted-foreground">SKU: {p.sku}</span>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "categoryName",
                header: "Categoría",
                cell: ({ row }) => {
                    const cat = row.original.categoryName ?? "Sin categoría";
                    return (
                        <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-zinc-500" />
                            <Badge variant="secondary" className="rounded-full">{cat}</Badge>
                        </div>
                    );
                },
            },
            {
                id: "originalPresentation",
                header: "Presentación original",
                cell: ({ row }) => {
                    const p = row.original;
                    return <span className="leading-tight">{formatPresentation(p)}</span>;
                },
            },
            {
                id: "standardPrice",
                header: "Precio",
                cell: ({ row }) => <span className="font-medium">{currency(row.original.standardPrice)}</span>,
            },
            {
                id: "saleModes",
                header: " Otros Modos Venta",
                cell: ({ row }) => {
                    const modes: SaleModeSummary[] = row.original.saleModes ?? [];
                    if (modes.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

                    return (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Badge variant="outline" className="rounded-lg text-xs cursor-pointer">
                                    {modes.length} Modos <List className="h-3 w-3 ml-1" />
                                </Badge>
                            </PopoverTrigger>
                            <PopoverContent className="p-2 w-64 min-w-[180px]">
                                <div className="flex flex-col gap-1.5">
                                    {modes.map((m) => {
                                        return (
                                            <div key={m.unitType} className="flex justify-between items-center gap-4 text-xs">
                                                <span className="flex-1 whitespace-normal">
                                                    {String(getSaleModeSummaryText(
                                                        m.unitType,
                                                        m.relativeQuantity,
                                                        row.original.presentation
                                                    ))}
                                                </span>
                                                <span className="font-medium">{currency(m.price)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                },
            },
            {
                id: "routes",
                header: "Vías de administración",
                cell: ({ row }) => {
                    const routes = row.original.administrationRoutes ?? [];
                    if (routes.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

                    if (routes.length <= 2) {
                        return (
                            <div className="flex max-w-[280px] flex-wrap gap-1">
                                {routes.map((r) => (
                                    <Badge key={String(r)} variant="outline" className="rounded-lg text-xs">
                                        {String(AdministrationRouteLabels[r])}
                                    </Badge>
                                ))}
                            </div>
                        );
                    }

                    return (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Badge variant="outline" className="rounded-lg text-xs cursor-pointer">
                                    {routes.length} Vías <List className="h-3 w-3 ml-1" />
                                </Badge>
                            </PopoverTrigger>
                            <PopoverContent className="p-2 w-auto">
                                <div className="flex flex-col gap-1">
                                    {routes.map((r) => (
                                        <Badge key={String(r)} variant="outline" className="rounded-lg text-xs">
                                            {String(AdministrationRouteLabels[r])}
                                        </Badge>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                },
            },
            {
                id: "stock",
                header: branchId && branchId !== 0 ? "Stock" : "Stock",
                cell: ({ row }) => {
                    const p = row.original as ProductSummaryResponse;

                    const formatStock = (u: number, f: number) => (f > 0 ? `${u} ${getProductPresentationTypeLabelByQuantity(p.presentation, u)} + ${f} ${getProductUnitTypeLabelByQuantity(p.unitType, f)}` : `${u} ${getProductPresentationTypeLabelByQuantity(p.presentation, u)}`);

                    if (branchId && branchId !== 0) {
                        const b = p.branchStocks?.find((x) => x.branchId === branchId);
                        if (!b) return <span className="text-xs text-muted-foreground">—</span>;

                        const isLow = (b.stockMainUnit ?? 0) < (p.minStock ?? 0);
                        return (
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${isLow ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                    }`}
                                title={isLow ? "Stock bajo" : "OK"}
                            >
                                {formatStock(b.stockMainUnit ?? 0, b.stockBaseUnitRemainder ?? 0)}
                            </span>
                        );
                    }

                    const sorted = [...(p.branchStocks ?? [])].sort((a, b) =>
                        a.branchName.localeCompare(b.branchName, "es", { sensitivity: "base" })
                    );

                    const totalStockText = formatStock(p.stockMainUnit ?? 0, p.stockBaseUnitRemainder ?? 0);
                    const totalStockIsLow = p.isBelowMinStock;

                    if (sorted.length === 0) {
                        return (
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${totalStockIsLow ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                    }`}
                                title={totalStockIsLow ? "Stock bajo (total)" : "OK (total)"}
                            >
                                {totalStockText}
                            </span>
                        );
                    }

                    return (
                        <Popover>
                            <PopoverTrigger asChild>
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 cursor-pointer ${totalStockIsLow ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                        }`}
                                    title={totalStockIsLow ? "Stock bajo (total)" : "OK (total)"}
                                >
                                    {totalStockText}
                                    <List className="h-3 w-3 ml-1.5" />
                                </span>
                            </PopoverTrigger>
                            <PopoverContent className="p-2 w-auto">
                                <div className="flex max-w-[520px] flex-col gap-1">
                                    {sorted.map((b) => {
                                        const isLow = (b.stockMainUnit ?? 0) < (p.minStock ?? 0);
                                        return (
                                            <div
                                                key={b.branchId}
                                                className="flex items-center justify-between rounded-md bg-zinc-50 px-2 py-1 ring-1 ring-zinc-100"
                                            >
                                                <span className="truncate text-xs">{b.branchName}</span>
                                                <span
                                                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs ring-1 ${isLow ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                                        }`}
                                                    title={isLow ? "Stock bajo" : "OK"}
                                                >
                                                    {formatStock(b.stockMainUnit ?? 0, b.stockBaseUnitRemainder ?? 0)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                },
            },
            {
                id: "status",
                header: "Estado",
                cell: ({ row }) => {
                    const p = row.original as ProductSummaryResponse;

                    if (branchId && branchId !== 0) {
                        const b = p.branchStocks?.find((x) => x.branchId === branchId);
                        if (!b) return <span className="text-xs text-muted-foreground">—</span>;
                        return (
                            <Badge
                                variant="outline"
                                title={b.active ? "Activo" : "Inactivo"}
                            >
                                {b.active ? "Activo" : "Inactivo"}
                            </Badge>
                        );
                    }

                    const stocks = p.branchStocks ?? [];
                    if (stocks.length === 0) {
                        return <span className="text-xs text-muted-foreground">Sin sucursales</span>;
                    }

                    const activos = stocks.filter((s) => s.active).length;
                    const inactivos = stocks.length - activos;

                    return (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Badge variant="outline" className="rounded-lg text-xs cursor-pointer">
                                    Activos {activos} • Inactivos {inactivos} <List className="h-3 w-3 ml-1" />
                                </Badge>
                            </PopoverTrigger>
                            <PopoverContent className="p-2 w-auto min-w-[240px]">
                                <div className="flex flex-col gap-1">
                                    {stocks
                                        .sort((a, b) => a.branchName.localeCompare(b.branchName, "es", { sensitivity: "base" }))
                                        .map((s) => (
                                            <div
                                                key={s.branchId}
                                                className="flex items-center justify-between rounded-md bg-zinc-50 px-2 py-1 ring-1 ring-zinc-100"
                                            >
                                                <span className="text-xs truncate">{s.branchName}</span>
                                                <span className={`text-[11px] ${s.active ? "text-emerald-600" : "text-zinc-500"}`}>
                                                    {s.active ? "Activo" : "Inactivo"}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                },
            },
        ];
        return cols;
    }, [branchId]);

    return inventoryColumns;
};