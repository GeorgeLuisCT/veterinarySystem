"use client";

import { useState, useEffect, useMemo } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import CustomerService from "../service/customer-service";
import { Ban, Eye, Pencil, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import { CustomerSummaryResponse } from "../types/customer-summary-response";
import { getAaxiosErrorMessage } from "@/helpers/error";

enum CustomerPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
}

export default function MainCustomers() {
  const { customers, setCustomers, removeCustomer } = useCustomerContext();

  const [loading, setLoading] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<CustomerPanel | null>(null);

  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

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
      { accessorKey: "documentNumber", header: "Número de Documento" },
      { accessorKey: "phoneNumber", header: "Teléfono" },
      { accessorKey: "email", header: "Correo" },
    ],
    []
  );

  const customerActions: Action<CustomerSummaryResponse>[] = [
    {
      label: "Ver",
      type: "direct",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => openPanel(CustomerPanel.View, row),
    },
    {
      label: "Editar",
      type: "direct",
      icon: <Pencil className="w-4 h-4" />,
      onClick: (row) => openPanel(CustomerPanel.Edit, row),
    },
    {
      label: "Desactivar",
      type: "dropdown",
      icon: <Ban className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(CustomerPanel.Disable, row),
    },
    {
      label: "Eliminar",
      type: "dropdown",
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(CustomerPanel.Delete, row),
    },
  ];

  useEffect(() => {
    fetchCustomers(0, 10, searchQuery);
  }, [searchQuery]);

  const fetchCustomers = async (page: number = 0, pageSize: number = 10, query?: string) => {
    setLoading(true);
    try {
      const response = await CustomerService.getCustomers({
        page,
        size: pageSize,
        active: true,
        query,
      });
      setCustomers(response);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar clientes";
      toast.error(message);
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableCustomer = async () => {
    if (selectedCustomer) {
      setLoading(true);
      try {
        await CustomerService.softDeleteCustomer(selectedCustomer.id);
        removeCustomer(selectedCustomer.id);
        toast.success(`El cliente ${selectedCustomer.name} ha sido desactivado`);
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al desactivar el cliente";
        toast.error(message);
        console.error("Error disabling customer:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteCustomer = async () => {
    if (selectedCustomer) {
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
    }
  };

  const customerContext = useCustomerContext();

  return (
    <div className="h-full">
      <DataTable<CustomerSummaryResponse>
        pageData={customers}
        columns={customerColumns}
        actions={customerActions}
        onSearch={setSearchQuery}
        pageIndex={customers.currentPage}
        pageSize={customers.pageSize}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        loading={loading}
      />

      <Dialog open={activePanel === CustomerPanel.Edit} onOpenChange={() => setActivePanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos del cliente. Los cambios se aplicarán globalmente.
            </DialogDescription>
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

      <ConfirmationDialog
        open={activePanel === CustomerPanel.Disable}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de deshabilitar este cliente?"
        description={
          <>
            Al deshabilitar <strong>{selectedCustomer?.name}</strong>, no podrá ser seleccionado en
            ventas.
          </>
        }
        tooltipMessage="Esta acción no afectará registros históricos de ventas."
        onConfirm={handleDisableCustomer}
        confirmText="Estoy seguro"
      />

      <ConfirmationDialog
        open={activePanel === CustomerPanel.Delete}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de eliminar este cliente?"
        description={
          <>
            Al eliminar <strong>{selectedCustomer?.name}</strong>, desaparecerá del sistema y no
            podrás recuperarlo.
          </>
        }
        tooltipMessage="Esta acción no afectará registros históricos de ventas."
        onConfirm={handleDeleteCustomer}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />

      <Dialog open={activePanel === CustomerPanel.View} onOpenChange={() => setActivePanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
            <DialogDescription>
              Visualiza la información registrada de este cliente.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && <CustomerDetail customerId={selectedCustomer.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
