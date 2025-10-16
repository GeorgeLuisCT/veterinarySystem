"use client";

import { useState, useEffect, useMemo } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { EmployeeSummaryResponse } from "../types/employee-summary-response";
import EmployeeService from "../service/employee-service";
import { Ban, Eye, Pencil, Trash2 } from "lucide-react";
import { useEmployeeContext } from "../context/employee-context";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmployeeForm } from "../form/employee-form";
import { EmployeeDetail } from "./employee-detail";
import { getAaxiosErrorMessage } from "@/helpers/error";

enum EmployeePanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
}

type Props = {
  branchId: number;
};

export default function MainEmployee({ branchId }: Props) {
  const { employees, setEmployees, removeEmployee } = useEmployeeContext();

  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<EmployeePanel | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

  const openPanel = (panel: EmployeePanel, employee: EmployeeSummaryResponse) => {
    setSelectedEmployee(employee);
    setActivePanel(panel);
  };

  const employeeColumns: ColumnDef<EmployeeSummaryResponse>[] = useMemo(() => {
    const columns: ColumnDef<EmployeeSummaryResponse>[] = [
      { accessorKey: "firstName", header: "Nombre" },
      { accessorKey: "lastName", header: "Apellido" },
      { accessorKey: "email", header: "Correo" },
      { accessorKey: "burden", header: "Cargo" },
    ];

    if (branchId === 0) {
      columns.push({ accessorKey: "branchNames", header: "Disponible en" });
    }

    return columns;
  }, [branchId]);

  const employeeActions: Action<EmployeeSummaryResponse>[] = [
    {
      label: "Ver",
      type: "direct",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => openPanel(EmployeePanel.View, row),
    },
    {
      label: "Editar",
      type: "direct",
      icon: <Pencil className="w-4 h-4" />,
      onClick: (row) => openPanel(EmployeePanel.Edit, row),
    },
    {
      label: "Desactivar",
      type: "dropdown",
      icon: <Ban className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(EmployeePanel.Disable, row),
    },
    {
      label: "Eliminar",
      type: "dropdown",
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(EmployeePanel.Delete, row),
    },
  ];

  useEffect(() => {
    fetchEmployees(0, 10, searchQuery);
  }, [branchId, searchQuery]);

  const fetchEmployees = async (page: number = 0, pageSize: number = 10, query?: string) => {
    setLoading(true);
    try {
      const response = await EmployeeService.getEmployees({
        page,
        size: pageSize,
        active: true,
        branchId,
        query,
      });
      setEmployees(response.content);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar empleados";
      toast.error(message);
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableEmployee = async () => {
    if (selectedEmployee) {
      setLoading(true);
      try {
        await EmployeeService.softDeleteEmployee(selectedEmployee.id, branchId);
        removeEmployee(selectedEmployee.id);
        toast.success(
          `Empleado desactivado correctamente ${branchId ? "en la sucursal actual" : "en todas las sucursales"}`
        );
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al desactivar el empleado";
        toast.error(message);
        console.error("Error disabling employee:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteEmployee = async () => {
    if (selectedEmployee) {
      setLoading(true);
      try {
        await EmployeeService.hardDeleteEmployee(selectedEmployee.id);
        removeEmployee(selectedEmployee.id);
        toast.success("Empleado eliminado correctamente");
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al eliminar el empleado";
        toast.error(message);
        console.error("Error deleting employee:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full">
      <DataTable<EmployeeSummaryResponse>
        data={employees}
        columns={employeeColumns}
        actions={employeeActions}
        fetchData={fetchEmployees}
        onSearch={setSearchQuery}
        totalPages={totalPages}
        loading={loading}
      />

      <Dialog open={activePanel === EmployeePanel.Edit} onOpenChange={() => setActivePanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
            <DialogDescription>Modifica los datos generales del empleado.</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeForm employeeId={selectedEmployee.id} setOpen={() => setActivePanel(null)} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={activePanel === EmployeePanel.Disable}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de deshabilitar este empleado?"
        description={
          branchId === 0 ? (
            <>
              Al deshabilitar <strong>{selectedEmployee?.firstName}</strong>, será removido de{" "}
              <strong>todas las sucursales</strong>.
            </>
          ) : (
            <>
              Al deshabilitar <strong>{selectedEmployee?.firstName}</strong>, será removido de{" "}
              <strong>la sucursal actual</strong>.
            </>
          )
        }
        tooltipMessage="Esta acción puede revertirse desde la sección de empleados inactivos."
        onConfirm={handleDisableEmployee}
        confirmText="Estoy seguro"
      />

      <ConfirmationDialog
        open={activePanel === EmployeePanel.Delete}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de eliminar este empleado?"
        description={
          <>
            Al eliminar <strong>{selectedEmployee?.firstName}</strong>, desaparecerá completamente
            del sistema.
          </>
        }
        tooltipMessage="Esta acción no se puede deshacer."
        onConfirm={handleDeleteEmployee}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />

      <Dialog open={activePanel === EmployeePanel.View} onOpenChange={() => setActivePanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Empleado</DialogTitle>
            <DialogDescription>
              {branchId === 0
                ? "Visualiza la información completa del empleado en todas las sucursales."
                : "Visualiza la información completa del empleado en esta sucursal."}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && <EmployeeDetail employeeId={selectedEmployee.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
