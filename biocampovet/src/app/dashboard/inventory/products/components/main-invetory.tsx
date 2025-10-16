"use client";

import { useState, useEffect, useMemo } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import ProductService from "../service/product-service";
import { ProductSummaryResponse } from "../types/product-summary-response";
import { Ban, Eye, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useProductContext } from "../context/product-context-type";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ProductDetail } from "./product-detail";
import { ProductForm } from "../form/product-form";
import { getAaxiosErrorMessage } from "@/helpers/error";
enum InventoryPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
}

type Props = {
  branchId: number;
};

export default function MainInvetory({ branchId }: Props) {
  const { products, setProducts, removeProduct } = useProductContext();

  const [loading, setLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<InventoryPanel | null>(null);

  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

  const openPanel = (panel: InventoryPanel, product: ProductSummaryResponse) => {
    setSelectedProduct(product);
    setActivePanel(panel);
  };

  const inventoryColumns: ColumnDef<ProductSummaryResponse>[] = useMemo(() => {
    const columns: ColumnDef<ProductSummaryResponse>[] = [
      { accessorKey: "name", header: "Producto" },
      { accessorKey: "categoryName", header: "Categoría" },
      { accessorKey: "formattedStock", header: "Stock" },
      { accessorKey: "standardPrice", header: "Precio" },
    ];

    if (branchId === 0) {
      columns.push({
        accessorKey: "branchNames",
        header: "Disponible en",
      });
    }

    return columns;
  }, [branchId]);

  const inventoryActions: Action<ProductSummaryResponse>[] = [
    {
      label: "Ver",
      type: "direct",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => openPanel(InventoryPanel.View, row),
    },
    {
      label: "Editar",
      type: "direct",
      icon: <Pencil className="w-4 h-4" />,
      onClick: (row) => openPanel(InventoryPanel.Edit, row),
    },
    {
      label: "Desactivar",
      type: "dropdown",
      icon: <Ban className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(InventoryPanel.Disable, row),
    },
    {
      label: "Eliminar",
      type: "dropdown",
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(InventoryPanel.Delete, row),
    },
  ];

  useEffect(() => {
    fetchProducts(0, 10, searchQuery);
  }, [branchId, searchQuery]);

  const fetchProducts = async (page: number = 0, pageSize: number = 10, searchQuery?: string) => {
    setLoading(true);
    try {
      const response = await ProductService.getProducts({
        page,
        size: pageSize,
        active: true,
        branchId,
        query: searchQuery,
      });
      setProducts(response);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar productos";
      toast.error(message);
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableProduct = async () => {
    if (selectedProduct) {
      setLoading(true);
      try {
        await ProductService.softDeleteProduct(selectedProduct.id, branchId);
        removeProduct(selectedProduct.id);
        toast.success(
          `El producto ${selectedProduct.name} ha sido desactivado para ${!branchId || branchId === 0 ? "todas las sucursales" : " la sucursal actual"}`
        );
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al desactivar el producto";
        toast.error(message);
        console.error("Error disabling product:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteProduct = async () => {
    if (selectedProduct) {
      setLoading(true);
      try {
        await ProductService.hardDeleteProduct(selectedProduct.id);
        removeProduct(selectedProduct.id);
        setActivePanel(null);
        toast.success("Producto eliminado correctamente");
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al eliminar el producto";
        toast.error(message);
        console.error("Error deleting product:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full">
      <DataTable<ProductSummaryResponse>
        pageData={products}
        columns={inventoryColumns}
        actions={inventoryActions}
        onSearch={setSearchQuery}
        pageIndex={products.currentPage}
        pageSize={products.pageSize}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        loading={loading}
      />

      <Dialog open={activePanel === InventoryPanel.Edit} onOpenChange={() => setActivePanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifica los datos generales del producto. Los cambios se aplicarán sin importar la
              sucursal.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm productId={selectedProduct.id} setOpen={() => setActivePanel(null)} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={activePanel === InventoryPanel.Disable}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de deshabilitar este producto?"
        description={
          branchId === 0 ? (
            <>
              Al deshabilitar <strong>{selectedProduct?.name}</strong>, dejará de estar disponible
              en <strong>todas las sucursales</strong>.
            </>
          ) : (
            <>
              Al deshabilitar <strong>{selectedProduct?.name}</strong>, dejará de estar disponible
              en <strong>la sucursal actual</strong>.
            </>
          )
        }
        tooltipMessage="Esta acción no será posible si el producto aún cuenta con stock."
        onConfirm={handleDisableProduct}
        confirmText="Estoy seguro"
      />

      <ConfirmationDialog
        open={activePanel === InventoryPanel.Delete}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de eliminar este producto?"
        description={
          <>
            Al eliminar <strong>{selectedProduct?.name}</strong>, desaparecerá de{" "}
            <strong>todas las sucursales</strong> y no podrás recuperarlo.
          </>
        }
        tooltipMessage="Esta acción no será posible si el producto aún cuenta con stock."
        onConfirm={handleDeleteProduct}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />

      <Dialog open={activePanel === InventoryPanel.View} onOpenChange={() => setActivePanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription>
              {!branchId || branchId === 0
                ? "Visualiza la información completa del producto en las diferentes sucursales."
                : "Visualiza la información completa del producto en esta sucursal."}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && <ProductDetail productId={selectedProduct.id} branchId={branchId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
