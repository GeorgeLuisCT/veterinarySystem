"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import ProductService from "../_service/product-service";
import { Ban, Eye, Pencil, Trash2, Box, Tag, List } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useProductContext } from "../_context/product-context-type";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ProductDetail } from "./product-detail";
import { ProductForm } from "./product-form";
import { getAaxiosErrorMessage } from "@/helpers/error";
import type { ProductSummaryResponse, ProductListParams } from "../_types/product-response";
import ProductFilters from "./product-filters";
import { getProductUnitTypeLabel, getProductUnitTypeLabelByQuantity } from "../_enums/product-unit-type";
import { getProductPresentationTypeLabel, getProductPresentationTypeLabelByQuantity } from "../_enums/product-presentation-type";

enum InventoryPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
}

type Props = { branchId: number };

const currency = (n: number | string) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 2 }).format(Number(n));

const formatStock = (u: number, f: number) => (f > 0 ? `${u} u + ${f}` : `${u} u`);

export default function MainInvetory({ branchId }: Props) {
  const { products, setProducts } = useProductContext();

  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<InventoryPanel | null>(null);

  const [filters, setFilters] = useState<Omit<ProductListParams, "page" | "size" | "branchId">>({
    q: undefined,
    categoryId: undefined,
    active: undefined,
    presentation: undefined,
    unitType: undefined,
    route: undefined,
    hasSaleModes: undefined,
    availableOnly: undefined,
    minStockAlertOnly: undefined,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const openPanel = (panel: InventoryPanel, product: ProductSummaryResponse) => {
    setSelectedProduct(product);
    setActivePanel(panel);
  };

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

          // Vista global: total como trigger + popover por sucursal (solo cantidades)
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

      // --- ESTADO (activo/inactivo) ---
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => {
          const p = row.original as ProductSummaryResponse;

          if (branchId && branchId !== 0) {
            // Solo la sucursal seleccionada, sin mostrar nombre
            const b = p.branchStocks?.find((x) => x.branchId === branchId);
            if (!b) return <span className="text-xs text-muted-foreground">—</span>;
            return (
              <Badge
                variant="outline"
                className={b.active ? "border-emerald-300 text-emerald-700" : "border-zinc-300 text-zinc-600"}
                title={b.active ? "Activo" : "Inactivo"}
              >
                {b.active ? "Activo" : "Inactivo"}
              </Badge>
            );
          }

          // Vista global: trigger "Activos X • Inactivos Y" + popover con detalle por sucursal
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


      {
        accessorKey: "standardPrice",
        header: "Precio",
        cell: ({ row }) => <span className="font-medium">{currency(row.original.standardPrice)}</span>,
      },
      {
        id: "saleModes",
        header: " Otros Modos Venta",
        cell: ({ row }) => {
          const modes = row.original.saleModes ?? [];
          if (modes.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Badge variant="outline" className="rounded-lg text-xs cursor-pointer">
                  {modes.length} Modos <List className="h-3 w-3 ml-1" />
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-auto min-w-[180px]">
                <div className="flex flex-col gap-1.5">
                  {modes.map((m) => (
                    <div key={m.unitType} className="flex justify-between items-center gap-4 text-xs">
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {String(m.unitType)}
                      </Badge>
                      <span className="font-medium">{currency(m.price)}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          );
        },
      },
      {
        id: "routes",
        header: "Vías",
        cell: ({ row }) => {
          const routes = row.original.administrationRoutes ?? [];
          if (routes.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

          if (routes.length <= 2) {
            return (
              <div className="flex max-w-[280px] flex-wrap gap-1">
                {routes.map((r) => (
                  <Badge key={String(r)} variant="outline" className="rounded-lg text-xs">
                    {String(r)}
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
                      {String(r)}
                    </Badge>
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

  const inventoryActions: Action<ProductSummaryResponse>[] = [
    { label: "Ver", type: "direct", icon: <Eye className="w-4 h-4" />, onClick: (row) => openPanel(InventoryPanel.View, row) },
    { label: "Editar", type: "direct", icon: <Pencil className="w-4 h-4" />, onClick: (row) => openPanel(InventoryPanel.Edit, row) },
    { label: "Desactivar", type: "dropdown", icon: <Ban className="w-4 h-4 text-red-500" />, onClick: (row) => openPanel(InventoryPanel.Disable, row) },
    { label: "Eliminar", type: "dropdown", icon: <Trash2 className="w-4 h-4 text-red-500" />, onClick: (row) => openPanel(InventoryPanel.Delete, row) },
  ];

  const fetchProducts = useCallback(async (page = 0, size = 10) => {
    setLoading(true);
    try {
      const resp = await ProductService.getProducts({
        page,
        size,
        branchId,
        ...filters,
      });
      console.log(resp);
      setProducts(resp);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar productos";
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [branchId, filters, setProducts]);

  useEffect(() => {
    fetchProducts(pageIndex, pageSize);
  }, [fetchProducts, pageIndex, pageSize]);

  return (
    <div className="h-full space-y-4">
      <ProductFilters
        branchId={branchId}
        value={filters}
        onChange={(f) => {
          setFilters(f);
          setPageIndex(0);
        }}
        onReset={() => {
          setFilters({
            q: undefined,
            categoryId: undefined,
            active: undefined,
            presentation: undefined,
            unitType: undefined,
            route: undefined,
            hasSaleModes: undefined,
            availableOnly: undefined,
            minStockAlertOnly: undefined,
          });
          setPageIndex(0);
        }}
      />

      <DataTable<ProductSummaryResponse>
        pageData={products}
        columns={inventoryColumns}
        actions={inventoryActions}
        pageIndex={products.currentPage}
        pageSize={products.pageSize}
        onPageIndexChange={(p) => setPageIndex(p)}
        onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }}
        loading={loading}
      />

      {selectedProduct && <ProductForm
        open={activePanel === InventoryPanel.Edit}
        productId={selectedProduct.id}
        setOpen={() => setActivePanel(null)}
      />}


      <ConfirmationDialog
        open={activePanel === InventoryPanel.Disable}
        onClose={() => setActivePanel(null)}
        title="¿Deshabilitar este producto?"
        description={
          branchId === 0 ? (
            <>Al deshabilitar <strong>{selectedProduct?.name}</strong>, dejará de estar disponible en <strong>todas las sucursales</strong>.</>
          ) : (
            <>Al deshabilitar <strong>{selectedProduct?.name}</strong>, dejará de estar disponible en <strong>la sucursal actual</strong>.</>
          )
        }
        tooltipMessage="No será posible si el producto aún cuenta con stock."
        onConfirm={async () => {
          if (!selectedProduct) return;
          setLoading(true);
          try {
            await ProductService.softDeleteProduct(selectedProduct.id, branchId);
            toast.success(
              `El producto ${selectedProduct.name} ha sido desactivado ${!branchId || branchId === 0 ? "en todas las sucursales" : "en la sucursal actual"
              }`
            );
            setActivePanel(null);
            fetchProducts(pageIndex, pageSize);
          } catch (error: unknown) {
            const message = getAaxiosErrorMessage(error) || "Error al desactivar el producto";
            toast.error(message);
          } finally {
            setLoading(false);
          }
        }}
        confirmText="Estoy seguro"
      />

      <ConfirmationDialog
        open={activePanel === InventoryPanel.Delete}
        onClose={() => setActivePanel(null)}
        title="¿Eliminar este producto?"
        description={
          <>Al eliminar <strong>{selectedProduct?.name}</strong>, desaparecerá de <strong>todas las sucursales</strong> y no podrás recuperarlo.</>
        }
        tooltipMessage="No será posible si el producto aún cuenta con stock."
        onConfirm={async () => {
          if (!selectedProduct) return;
          setLoading(true);
          try {
            await ProductService.hardDeleteProduct(selectedProduct.id);
            toast.success("Producto eliminado correctamente");
            setActivePanel(null);
            fetchProducts(pageIndex, pageSize);
          } catch (error: unknown) {
            const message = getAaxiosErrorMessage(error) || "Error al eliminar el producto";
            toast.error(message);
          } finally {
            setLoading(false);
          }
        }}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />

      <Dialog open={activePanel === InventoryPanel.View} onOpenChange={() => setActivePanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription>
              {!branchId || branchId === 0
                ? "Información completa del producto en distintas sucursales."
                : "Información del producto en esta sucursal."}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && <ProductDetail productId={selectedProduct.id} branchId={branchId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}