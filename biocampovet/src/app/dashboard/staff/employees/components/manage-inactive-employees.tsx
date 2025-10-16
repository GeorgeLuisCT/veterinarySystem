"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { EmployeeSummaryResponse } from "../types/employee-summary-response";
import EmployeeService from "../service/employee-service";
import { RotateCw, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { toast } from "sonner";
import { useEmployeeContext } from "../context/employee-context";
import { getAaxiosErrorMessage } from "@/helpers/error";

enum EmployeePanel {
  Enable = "enable",
  Delete = "delete",
}

type Props = {
  branchId: number;
};

export default function ManageInactiveEmployees({ branchId }: Props) {
  const { addEmployee } = useEmployeeContext();

  const [inactiveEmployees, setInactiveEmployees] = useState<EmployeeSummaryResponse[]>([]);
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

    if (!branchId || branchId === 0) {
      columns.push({ accessorKey: "branchNames", header: "Inactivo en" });
    }

    return columns;
  }, [branchId]);

  const employeeActions: Action<EmployeeSummaryResponse>[] = [
    {
      label: "Activar",
      type: "direct",
      icon: <RotateCw className="w-4 h-4" />,
      onClick: (row) => openPanel(EmployeePanel.Enable, row),
    },
    {
      label: "Eliminar",
      type: "direct",
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
        active: false,
        branchId,
        query,
      });
      setInactiveEmployees(response.content);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar empleados";
      toast.error(message);
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (selectedEmployee) {
      setLoading(true);
      try {
        await EmployeeService.hardDeleteEmployee(selectedEmployee.id);
        setInactiveEmployees((prev) => prev.filter((emp) => emp.id !== selectedEmployee.id));
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

  const handleEnableEmployee = async () => {
    if (selectedEmployee) {
      setLoading(true);
      try {
        const restored = await EmployeeService.restoreEmployee(selectedEmployee.id, branchId);
        setInactiveEmployees((prev) => prev.filter((emp) => emp.id !== selectedEmployee.id));
        addEmployee(restored);
        toast.success(
          `El empleado ${restored.firstName} ha sido activado para ${branchId ? "la sucursal actual" : "todas las sucursales"}`
        );
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al activar el empleado";
        toast.error(message);
        console.error("Error enabling employee:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full">
      <DataTable<EmployeeSummaryResponse>
        data={inactiveEmployees}
        columns={employeeColumns}
        actions={employeeActions}
        fetchData={fetchEmployees}
        onSearch={setSearchQuery}
        totalPages={totalPages}
        loading={loading}
      />

      <ConfirmationDialog
        open={activePanel === EmployeePanel.Enable}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de activar este empleado?"
        description={
          branchId === 0 ? (
            <>
              Al activar <strong>{selectedEmployee?.firstName}</strong>, estará disponible en{" "}
              <strong>todas las sucursales</strong>.
            </>
          ) : (
            <>
              Al activar <strong>{selectedEmployee?.firstName}</strong>, estará disponible en{" "}
              <strong>la sucursal actual</strong>.
            </>
          )
        }
        showTooltip={false}
        onConfirm={handleEnableEmployee}
        confirmText="Estoy seguro"
      />

      <ConfirmationDialog
        open={activePanel === EmployeePanel.Delete}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de eliminar este empleado?"
        description={
          <>
            Al eliminar <strong>{selectedEmployee?.firstName}</strong>, desaparecerá de{" "}
            <strong>todas las sucursales</strong> y no podrás recuperarlo.
          </>
        }
        tooltipMessage="Esta acción no se puede deshacer."
        onConfirm={handleDeleteEmployee}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />
    </div>
  );
}
