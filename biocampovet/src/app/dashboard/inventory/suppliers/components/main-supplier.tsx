"use client";

import { useState, useEffect, useMemo } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SupplierSummaryResponse } from "../types/supplier-summary-response";
import SupplierService from "../service/supplier-service";
import { Ban, Eye, Pencil, Trash2 } from "lucide-react";
import { useSupplierContext } from "../context/supplier-context";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SupplierForm } from "../form/supplier-form";
import { SupplierDetail } from "./supplier-detail";
import { getAaxiosErrorMessage } from "@/helpers/error";

enum SupplierPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
}

export default function MainSupplier() {
  const { suppliers, setSuppliers, removeSupplier } = useSupplierContext();

  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<SupplierPanel | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

  const openPanel = (panel: SupplierPanel, supplier: SupplierSummaryResponse) => {
    setSelectedSupplier(supplier);
    setActivePanel(panel);
  };

  const supplierColumns: ColumnDef<SupplierSummaryResponse>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Nombre" },
      { accessorKey: "ruc", header: "RUC" },
      { accessorKey: "contactPhone", header: "Teléfono" },
      { accessorKey: "email", header: "Correo" },
      { accessorKey: "supplierType", header: "Tipo" },
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

  useEffect(() => {
    fetchSuppliers(0, 10, searchQuery);
  }, [searchQuery]);

  const fetchSuppliers = async (page: number = 0, pageSize: number = 10, query?: string) => {
    setLoading(true);
    try {
      const response = await SupplierService.getSuppliers({
        page,
        size: pageSize,
        active: true,
        query,
      });
      setSuppliers(response.content);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar proveedores";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSupplier = async () => {
    if (selectedSupplier) {
      setLoading(true);
      try {
        await SupplierService.softDeleteSupplier(selectedSupplier.id);
        removeSupplier(selectedSupplier.id);
        toast.success("Proveedor desactivado correctamente");
        setActivePanel(null);
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
        removeSupplier(selectedSupplier.id);
        toast.success("Proveedor eliminado correctamente");
        setActivePanel(null);
      } catch (error: unknown) {
        toast.error(getAaxiosErrorMessage(error) || "Error al eliminar el proveedor");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full">
      <DataTable<SupplierSummaryResponse>
        data={suppliers}
        columns={supplierColumns}
        actions={supplierActions}
        fetchData={fetchSuppliers}
        onSearch={setSearchQuery}
        totalPages={totalPages}
        loading={loading}
      />

      <Dialog open={activePanel === SupplierPanel.Edit} onOpenChange={() => setActivePanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription>Modifica los datos generales del proveedor.</DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <SupplierForm supplierId={selectedSupplier.id} setOpen={() => setActivePanel(null)} />
          )}
        </DialogContent>
      </Dialog>

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
        tooltipMessage="Esta acción puede revertirse desde la sección de proveedores inactivos."
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
