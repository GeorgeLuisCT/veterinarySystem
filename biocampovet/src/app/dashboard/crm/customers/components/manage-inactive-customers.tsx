"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import CustomerService from "../service/customer-service";
import { RotateCw, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useCustomerContext } from "../context/customer-context";
import { toast } from "sonner";
import { CustomerSummaryResponse } from "../types/customer-summary-response";
import { getAaxiosErrorMessage } from "@/helpers/error";

enum CustomerPanel {
  Enable = "enable",
  Delete = "delete",
}

export default function ManageInactiveCustomers() {
  const { addCustomer } = useCustomerContext();

  const [inactiveCustomers, setInactiveCustomers] = useState<CustomerSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<CustomerPanel | null>(null);

  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

  const openPanel = (panel: CustomerPanel, customer: CustomerSummaryResponse) => {
    setSelectedCustomer(customer);
    setActivePanel(panel);
  };

  const customerColumns: ColumnDef<CustomerSummaryResponse>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Nombre" },
      { accessorKey: "documentTypeName", header: "Tipo de Documento" },
      { accessorKey: "documentNumber", header: "Número de Documento" },
    ],
    []
  );

  const customerActions: Action<CustomerSummaryResponse>[] = [
    {
      label: "Activar",
      type: "direct",
      icon: <RotateCw className="w-4 h-4" />,
      onClick: (row) => openPanel(CustomerPanel.Enable, row),
    },
    {
      label: "Eliminar",
      type: "direct",
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(CustomerPanel.Delete, row),
    },
  ];

  useEffect(() => {
    fetchCustomers(0, 10, searchQuery);
  }, [searchQuery]);

  const fetchCustomers = async (page: number = 0, pageSize: number = 10, searchQuery?: string) => {
    setLoading(true);
    try {
      const response = await CustomerService.getCustomers({
        page,
        size: pageSize,
        active: false,
        query: searchQuery,
      });
      setInactiveCustomers(response.content);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar clientes";
      toast.error(message);
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableCustomer = async () => {
    if (selectedCustomer) {
      setLoading(true);
      try {
        const result = await CustomerService.restoreCustomer(selectedCustomer.id);
        setInactiveCustomers((prev) => prev.filter((c) => c.id !== selectedCustomer.id));
        addCustomer(result);
        toast.success(`El cliente ${result.name} ha sido activado`);
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al activar el cliente";
        toast.error(message);
        console.error("Error enabling customer:", error);
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
        setInactiveCustomers((prev) => prev.filter((c) => c.id !== selectedCustomer.id));
        toast.success("Cliente eliminado correctamente");
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al eliminar el cliente";
        toast.error(message);
        console.error("Error deleting customer:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full">
      <DataTable<CustomerSummaryResponse>
        data={inactiveCustomers}
        columns={customerColumns}
        actions={customerActions}
        fetchData={fetchCustomers}
        onSearch={setSearchQuery}
        totalPages={totalPages}
        loading={loading}
      />

      <ConfirmationDialog
        open={activePanel === CustomerPanel.Enable}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de activar este cliente?"
        description={
          <>
            Al activar <strong>{selectedCustomer?.name}</strong>, estará disponible nuevamente en
            ventas.
          </>
        }
        showTooltip={false}
        onConfirm={handleEnableCustomer}
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
        tooltipMessage="Esta acción no afectará registros históricos."
        onConfirm={handleDeleteCustomer}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />
    </div>
  );
}
