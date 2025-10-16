"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SupplierSummaryResponse } from "../types/supplier-summary-response";
import SupplierService from "../service/supplier-service";
import { RotateCw, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { toast } from "sonner";
import { useSupplierContext } from "../context/supplier-context";
import { getAaxiosErrorMessage } from "@/helpers/error";

enum SupplierPanel {
  Enable = "enable",
  Delete = "delete",
}

type Props = {
  branchId: number;
};

export default function ManageInactiveSuppliers({ branchId }: Props) {
  const { addSupplier } = useSupplierContext();

  const [inactiveSuppliers, setInactiveSuppliers] = useState<SupplierSummaryResponse[]>([]);
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
      { accessorKey: "businessName", header: "Razón Social" },
      { accessorKey: "ruc", header: "RUC" },
      { accessorKey: "email", header: "Correo" },
      { accessorKey: "phoneNumber", header: "Teléfono" },
    ],
    []
  );

  const supplierActions: Action<SupplierSummaryResponse>[] = [
    {
      label: "Activar",
      type: "direct",
      icon: <RotateCw className="w-4 h-4" />,
      onClick: (row) => openPanel(SupplierPanel.Enable, row),
    },
    {
      label: "Eliminar",
      type: "direct",
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(SupplierPanel.Delete, row),
    },
  ];

  useEffect(() => {
    fetchSuppliers(0, 10, searchQuery);
  }, [branchId, searchQuery]);

  const fetchSuppliers = async (page = 0, pageSize = 10, query?: string) => {
    setLoading(true);
    try {
      const response = await SupplierService.getSuppliers({
        page,
        size: pageSize,
        active: false,
        query,
      });
      setInactiveSuppliers(response.content);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar proveedores";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    setLoading(true);
    try {
      await SupplierService.hardDeleteSupplier(selectedSupplier.id);
      setInactiveSuppliers((prev) => prev.filter((s) => s.id !== selectedSupplier.id));
      toast.success("Proveedor eliminado correctamente");
      setActivePanel(null);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al eliminar el proveedor";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableSupplier = async () => {
    if (!selectedSupplier) return;

    setLoading(true);
    try {
      const restored = await SupplierService.restoreSupplier(selectedSupplier.id);
      setInactiveSuppliers((prev) => prev.filter((s) => s.id !== selectedSupplier.id));
      addSupplier(restored);
      toast.success(`Proveedor ${restored.name} activado correctamente`);
      setActivePanel(null);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al activar el proveedor";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      <DataTable<SupplierSummaryResponse>
        data={inactiveSuppliers}
        columns={supplierColumns}
        actions={supplierActions}
        fetchData={fetchSuppliers}
        onSearch={setSearchQuery}
        totalPages={totalPages}
        loading={loading}
      />

      <ConfirmationDialog
        open={activePanel === SupplierPanel.Enable}
        onClose={() => setActivePanel(null)}
        title="¿Activar proveedor?"
        description={`¿Estás seguro de activar a ${selectedSupplier?.name}?`}
        showTooltip={false}
        onConfirm={handleEnableSupplier}
        confirmText="Sí, activar"
      />

      <ConfirmationDialog
        open={activePanel === SupplierPanel.Delete}
        onClose={() => setActivePanel(null)}
        title="¿Eliminar proveedor?"
        description={`Al eliminar a ${selectedSupplier?.name}, desaparecerá del sistema de forma permanente.`}
        tooltipMessage="Esta acción no se puede deshacer."
        onConfirm={handleDeleteSupplier}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />
    </div>
  );
}
