"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable, { Action } from "@/components/data-table";
import ProductService from "../_service/product-service";
import { Ban, Eye, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useProductContext } from "../_context/product-context-type";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ProductDetail } from "./product-detail";
import { ProductForm } from "./product-form";
import { getAaxiosErrorMessage } from "@/helpers/error";
import type { ProductSummaryResponse, ProductListParams } from "../_types/product-response";
import ProductFilters from "./product-filters";
import { useInventoryColumns } from "./main-invetory-rows";

enum InventoryPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
}

type Props = { branchId: number };


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

  const inventoryColumns = useInventoryColumns(branchId);

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