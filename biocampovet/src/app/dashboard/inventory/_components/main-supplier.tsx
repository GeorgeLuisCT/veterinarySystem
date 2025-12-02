"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SupplierSummaryResponse, SupplierListParams } from "../_types/supplier-response";
import SupplierService from "../_service/supplier-service";
import { Ban, Eye, Pencil, Trash2, Building } from "lucide-react";
import { useSupplierContext } from "../_context/supplier-context";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SupplierForm } from "./supplier-form";
import { SupplierDetail } from "./supplier-detail";
import { getAaxiosErrorMessage } from "@/helpers/error";
import SupplierFilters from "./supplier-filters";
import { Badge } from "@/components/ui/badge";

enum SupplierPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
}

export default function MainSupplier() {
  const { suppliers, setSuppliers } = useSupplierContext();

  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<SupplierPanel | null>(null);

  const [filters, setFilters] = useState<Omit<SupplierListParams, "page" | "size">>({
    q: undefined,
    active: true,
    supplierType: undefined,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const openPanel = (panel: SupplierPanel, supplier: SupplierSummaryResponse) => {
    setSelectedSupplier(supplier);
    setActivePanel(panel);
  };

  const supplierColumns: ColumnDef<SupplierSummaryResponse>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Proveedor",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                <Building className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium leading-tight">{s.name}</span>
                <span className="text-xs text-muted-foreground">RUC: {s.ruc}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) => row.original.phone ?? "—",
      },
      { accessorKey: "email", header: "Correo" },
      {
        accessorKey: "supplierType",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="secondary" className="rounded-full">
            {row.original.supplierType}
          </Badge>
        ),
      },
    ],
    []
  );

  const supplierActions: Action<SupplierSummaryResponse>[] = [
    {
      label: "Ver",
      type: "direct",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => openPanel(SupplierPanel.View, row),
    },
    {
      label: "Editar",
      type: "direct",
      icon: <Pencil className="w-4 h-4" />,
      onClick: (row) => openPanel(SupplierPanel.Edit, row),
    },
    {
      label: "Desactivar",
      type: "dropdown",
      icon: <Ban className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(SupplierPanel.Disable, row),
    },
    {
      label: "Eliminar",
      type: "dropdown",
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(SupplierPanel.Delete, row),
    },
  ];

  const fetchSuppliers = useCallback(
    async (page = 0, size = 10) => {
      setLoading(true);
      try {
        const response = await SupplierService.getSuppliers({
          page,
          size,
          ...filters,
        });
        setSuppliers(response);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al cargar proveedores";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [filters, setSuppliers]
  );

  useEffect(() => {
    fetchSuppliers(pageIndex, pageSize);
  }, [fetchSuppliers, pageIndex, pageSize]);

  const handleDisableSupplier = async () => {
    if (selectedSupplier) {
      setLoading(true);
      try {
        await SupplierService.softDeleteSupplier(selectedSupplier.id);
        toast.success("Proveedor desactivado correctamente");
        setActivePanel(null);
        fetchSuppliers(pageIndex, pageSize);
      } catch (error: unknown) {
        toast.error(getAaxiosErrorMessage(error) || "Error al desactivar el proveedor");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteSupplier = async () => {
    if (selectedSupplier) {
      setLoading(true);
      try {
        await SupplierService.hardDeleteSupplier(selectedSupplier.id);
        toast.success("Proveedor eliminado correctamente");
        setActivePanel(null);
        fetchSuppliers(pageIndex, pageSize);
      } catch (error: unknown) {
        toast.error(getAaxiosErrorMessage(error) || "Error al eliminar el proveedor");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full space-y-4">
      <SupplierFilters
        value={filters}
        onChange={(f) => {
          setFilters(f);
          setPageIndex(0);
        }}
        onReset={() => {
          setFilters({
            q: undefined,
            active: true,
            supplierType: undefined,
          });
          setPageIndex(0);
        }}
      />

      <DataTable<SupplierSummaryResponse>
        pageData={suppliers}
        columns={supplierColumns}
        actions={supplierActions}
        pageIndex={suppliers.currentPage}
        pageSize={suppliers.pageSize}
        onPageIndexChange={(p) => setPageIndex(p)}
        onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }}
        loading={loading}
      />

      {selectedSupplier && (
        <SupplierForm
          open={activePanel === SupplierPanel.Edit}
          supplierId={selectedSupplier.id}
          setOpen={() => setActivePanel(null)}
        />
      )}

      <ConfirmationDialog
        open={activePanel === SupplierPanel.Disable}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de deshabilitar este proveedor?"
        description={
          <>
            Al deshabilitar <strong>{selectedSupplier?.name}</strong>, ya no estará disponible para
            futuros registros.
          </>
        }
        tooltipMessage="Esta acción puede revertirse."
        onConfirm={handleDisableSupplier}
        confirmText="Deshabilitar"
      />

      <ConfirmationDialog
        open={activePanel === SupplierPanel.Delete}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de eliminar este proveedor?"
        description={
          <>
            Al eliminar <strong>{selectedSupplier?.name}</strong>, desaparecerá completamente del
            sistema.
          </>
        }
        tooltipMessage="Esta acción no se puede deshacer."
        onConfirm={handleDeleteSupplier}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />

      <Dialog open={activePanel === SupplierPanel.View} onOpenChange={() => setActivePanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Proveedor</DialogTitle>
            <DialogDescription>Visualiza la información completa del proveedor.</DialogDescription>
          </DialogHeader>
          {selectedSupplier && <SupplierDetail supplierId={selectedSupplier.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
