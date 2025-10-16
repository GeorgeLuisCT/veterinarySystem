"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import ProductService from "../service/product-service";
import { ProductSummaryResponse } from "../types/product-summary-response";
import { RotateCw, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { toast } from "sonner";
import { useProductContext } from "../context/product-context-type";
import { getAaxiosErrorMessage } from "@/helpers/error";

enum InventoryPanel {
  Enable = "enable",
  Delete = "Delete",
}

type Props = {
  branchId: number;
};

export default function ManageInactivProducts({ branchId }: Props) {
  const { addProduct } = useProductContext();

  const [inactiveProducts, setInactiveProducts] = useState<ProductSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<InventoryPanel | null>(null);

  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

  const openPanel = (panel: InventoryPanel, product: ProductSummaryResponse) => {
    setSelectedProduct(product);
    setActivePanel(panel);
  };

  const inventoryColumns: ColumnDef<ProductSummaryResponse>[] = useMemo(() => {
    const columns: ColumnDef<ProductSummaryResponse>[] = [];

    columns.push(
      { accessorKey: "name", header: "Producto" },
      { accessorKey: "standardPrice", header: "Precio" }
    );

    if (!branchId || branchId === 0) {
      columns.push({ accessorKey: "branchNames", header: "Inactivo en" });
    }

    return columns;
  }, [branchId]);

  const inventoryActions: Action<ProductSummaryResponse>[] = [
    {
      label: "Activar",
      type: "direct",
      icon: <RotateCw className="w-4 h-4" />,
      onClick: (row) => openPanel(InventoryPanel.Enable, row),
    },
    {
      label: "Eliminar",
      type: "direct",
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
        active: false,
        branchId,
        query: searchQuery,
      });
      setInactiveProducts(response.content);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar productos";
      toast.error(message);
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (selectedProduct) {
      setLoading(true);
      try {
        await ProductService.hardDeleteProduct(selectedProduct.id);
        setInactiveProducts((prevProducts) =>
          prevProducts.filter((product) => product.id !== selectedProduct.id)
        );
        toast.success("Producto eliminado correctamente");
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al eliminar el producto";
        toast.error(message);
        console.error("Error deleting products:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEnableProduct = async () => {
    if (selectedProduct) {
      setLoading(true);
      try {
        const result = await ProductService.restoreProduct(selectedProduct.id, branchId);
        setInactiveProducts((prevProducts) =>
          prevProducts.filter((product) => product.id !== selectedProduct.id)
        );
        addProduct(result);
        toast.success(
          `El producto ${result.name} ha sido activado para ${!branchId || branchId === 0 ? "todas las sucursales" : " la sucursal actual"}`
        );
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al activar el producto";
        toast.error(message);
        console.error("Error enabling products:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full">
      <DataTable<ProductSummaryResponse>
        data={inactiveProducts}
        columns={inventoryColumns}
        actions={inventoryActions}
        fetchData={fetchProducts}
        onSearch={setSearchQuery}
        totalPages={totalPages}
        loading={loading}
      />

      <ConfirmationDialog
        open={activePanel === InventoryPanel.Enable}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de activar este producto?"
        description={
          branchId === 0 ? (
            <>
              Al activar <strong>{selectedProduct?.name}</strong>, estará disponible en{" "}
              <strong>todas las sucursales</strong>.
            </>
          ) : (
            <>
              Al activar <strong>{selectedProduct?.name}</strong>, estará disponible en{" "}
              <strong>la sucursal actual</strong>.
            </>
          )
        }
        showTooltip={false}
        onConfirm={handleEnableProduct}
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
    </div>
  );
}
