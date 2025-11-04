"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import CustomerService from "../service/customer-service";
import { Ban, Eye, Pencil, Trash2, RotateCcw } from "lucide-react";
import { useCustomerContext } from "../context/customer-context";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CustomerForm } from "../form/customer-form";
import { CustomerDetail } from "./customer-detail";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CustomerSummaryResponse } from "../types/customer-summary-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import CustomerFilters, { CustomerFiltersShape } from "./customer-filters";

enum CustomerPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
  Restore = "restore",
}

const DEFAULT_FILTERS: CustomerFiltersShape = {
  q: undefined,
  active: true, // API requiere boolean
};

export default function MainCustomers() {
  const { customers, setCustomers, removeCustomer } = useCustomerContext();

  const [loading, setLoading] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<CustomerPanel | null>(null);

  // filtros separados (como en inventario)
  const [filters, setFilters] = useState<CustomerFiltersShape>(DEFAULT_FILTERS);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const openPanel = (panel: CustomerPanel, customer: CustomerSummaryResponse) => {
    setSelectedCustomer(customer);
    setActivePanel(panel);
  };

  const customerColumns: ColumnDef<CustomerSummaryResponse>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Nombre" },
      { accessorKey: "documentTypeName", header: "Tipo de Documento" },
      { accessorKey: "documentNumber", header: "N° Documento" },
      { accessorKey: "phoneNumber", header: "Teléfono" },
      { accessorKey: "email", header: "Correo" },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => {
          const active = row.original.isActive ?? true;
          return (
            <Badge variant="outline" className={active ? "text-emerald-700" : "text-zinc-500"}>
              {active ? "Activo" : "Inactivo"}
            </Badge>
          );
        },
      },
    ],
    []
  );

  const customerActions: Action<CustomerSummaryResponse>[] = [
    { label: "Ver", type: "direct", icon: <Eye className="w-4 h-4" />, onClick: (row) => openPanel(CustomerPanel.View, row) },
    { label: "Editar", type: "direct", icon: <Pencil className="w-4 h-4" />, onClick: (row) => openPanel(CustomerPanel.Edit, row) },
    {
      label: "Desactivar",
      type: "dropdown",
      icon: <Ban className="w-4 h-4 text-red-500" />,
      onClick: (row) => {
        if (row.isActive === false) {
          openPanel(CustomerPanel.Restore, row);
        } else {
          openPanel(CustomerPanel.Disable, row);
        }
      },
    },
    {
      label: "Reactivar",
      type: "dropdown",
      icon: <RotateCcw className="w-4 h-4" />,
      onClick: (row) => openPanel(CustomerPanel.Restore, row),
    },
    {
      label: "Eliminar",
      type: "dropdown",
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(CustomerPanel.Delete, row),
    },
  ];

  const fetchCustomers = useCallback(async (page = 0, size = 10) => {
    setLoading(true);
    try {
      const resp = await CustomerService.getCustomers({
        page,
        size,
        active: filters.active,              // requerido
        query: filters.q ?? undefined,       // buscador desde filtros
      });
      setCustomers(resp);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar clientes";
      toast.error(message);
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, setCustomers]);

  // resetear página cuando cambian filtros
  useEffect(() => {
    setPageIndex(0);
  }, [filters]);

  useEffect(() => {
    fetchCustomers(pageIndex, pageSize);
  }, [fetchCustomers, pageIndex, pageSize]);

  const handleDisableCustomer = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      await CustomerService.softDeleteCustomer(selectedCustomer.id);
      toast.success(`El cliente ${selectedCustomer.name} ha sido desactivado`);
      setActivePanel(null);
      fetchCustomers(pageIndex, pageSize);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al desactivar el cliente";
      toast.error(message);
      console.error("Error disabling customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCustomer = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      await CustomerService.restoreCustomer(selectedCustomer.id);
      toast.success(`El cliente ${selectedCustomer.name} ha sido reactivado`);
      setActivePanel(null);
      fetchCustomers(pageIndex, pageSize);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al reactivar el cliente";
      toast.error(message);
      console.error("Error restoring customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      await CustomerService.hardDeleteCustomer(selectedCustomer.id);
      removeCustomer(selectedCustomer.id);
      setActivePanel(null);
      toast.success("Cliente eliminado correctamente");
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al eliminar el cliente";
      toast.error(message);
      console.error("Error deleting customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const customerContext = useCustomerContext();

  return (
    <div className="h-full space-y-4">
      {/* Filtros separados */}
      <CustomerFilters
        value={filters}
        onChange={(f) => {
          setFilters(f);
          setPageIndex(0);
        }}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setPageIndex(0);
        }}
      />

      <DataTable<CustomerSummaryResponse>
        pageData={customers}
        columns={customerColumns}
        actions={customerActions}
        // OJO: ya no pasamos onSearch a la tabla, la búsqueda está en filtros
        pageIndex={customers.currentPage}
        pageSize={customers.pageSize}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }}
        loading={loading}
      />

      {/* Editar */}
      <Dialog open={activePanel === CustomerPanel.Edit} onOpenChange={() => setActivePanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Modifica los datos del cliente.</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm
              customerId={selectedCustomer.id}
              setOpen={() => setActivePanel(null)}
              customerContext={customerContext}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Ver */}
      <Dialog open={activePanel === CustomerPanel.View} onOpenChange={() => setActivePanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
            <DialogDescription>Visualiza la información registrada.</DialogDescription>
          </DialogHeader>
          {selectedCustomer && <CustomerDetail customerId={selectedCustomer.id} />}
        </DialogContent>
      </Dialog>

      {/* Desactivar */}
      <ConfirmationDialog
        open={activePanel === CustomerPanel.Disable}
        onClose={() => setActivePanel(null)}
        title="¿Deshabilitar este cliente?"
        description={
          <>Al deshabilitar <strong>{selectedCustomer?.name}</strong>, no podrá ser seleccionado en ventas.</>
        }
        tooltipMessage="Esta acción no afectará registros históricos."
        onConfirm={handleDisableCustomer}
        confirmText="Estoy seguro"
      />

      {/* Reactivar */}
      <ConfirmationDialog
        open={activePanel === CustomerPanel.Restore}
        onClose={() => setActivePanel(null)}
        title="¿Reactivar este cliente?"
        description={
          <>Al reactivar a <strong>{selectedCustomer?.name}</strong>, volverá a estar disponible para su selección.</>
        }
        onConfirm={handleRestoreCustomer}
        confirmText="Reactivar"
      />

      {/* Eliminar */}
      <ConfirmationDialog
        open={activePanel === CustomerPanel.Delete}
        onClose={() => setActivePanel(null)}
        title="¿Eliminar este cliente?"
        description={
          <>Al eliminar <strong>{selectedCustomer?.name}</strong>, desaparecerá del sistema y no podrás recuperarlo.</>
        }
        tooltipMessage="No afectará registros históricos de ventas ya emitidas."
        onConfirm={handleDeleteCustomer}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />
    </div>
  );
}
