"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Ban, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

import UserService from "./service/users-service";
import { UserSummaryResponse } from "./types/user-summary-response";
import { PaginatedResponse } from "@/types/paginated-response";
import { Badge } from "@/components/ui/badge";
import UsersFilters, { UsersFiltersShape } from "./components/users-filters";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserDetail } from "./components/user-detail";
import { getAaxiosErrorMessage } from "@/helpers/error";

enum UsersPanel {
  View = "view",
  Disable = "disable",
  Activate = "activate",
  Delete = "delete",
}

type Props = { branchId: number; refreshKey?: number };

const DEFAULT_FILTERS: UsersFiltersShape = {
  q: undefined,
  active: true,
};

export default function MainUsers({ branchId, refreshKey = 0 }: Props) {
  const [users, setUsers] = useState<PaginatedResponse<UserSummaryResponse>>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
    currentPage: 0,
  });

  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<UsersPanel | null>(null);

  const [filters, setFilters] = useState<UsersFiltersShape>(DEFAULT_FILTERS);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const openPanel = (panel: UsersPanel, user: UserSummaryResponse) => {
    setSelectedUser(user);
    setActivePanel(panel);
  };

  const usersColumns: ColumnDef<UserSummaryResponse>[] = useMemo(() => {
    const columns: ColumnDef<UserSummaryResponse>[] = [
      { accessorKey: "username", header: "Usuario" },
      { accessorKey: "fullName", header: "Empleado" },
      { accessorKey: "email", header: "Correo" },
      {
        accessorKey: "cantRoles",
        header: "Roles",
        cell: ({ row }) => <span>{row.original.cantRoles}</span>,
      },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => {
          const active = row.original.active;
          return (
            <Badge variant={active ? "success" : "neutral"}>
              {active ? "Activo" : "Inactivo"}
            </Badge>
          );
        },
      },
    ];

    if (branchId === 0) {
      columns.splice(columns.length - 2, 0, {
        accessorKey: "branchNames",
        header: "Disponible en",
      });
    }

    return columns;
  }, [branchId]);

  const usersActions: Action<UserSummaryResponse>[] = [
    { label: "Ver", type: "direct", icon: <Eye className="w-4 h-4" />, onClick: (row) => openPanel(UsersPanel.View, row) },
    {
      label: "Desactivar",
      type: "dropdown",
      icon: <Ban className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(UsersPanel.Disable, row),
      isVisible: (row) => row.active,
    },
    {
      label: "Activar",
      type: "dropdown",
      icon: <Ban className="w-4 h-4 text-success-strong" />,
      onClick: (row) => openPanel(UsersPanel.Activate, row),
      isVisible: (row) => !row.active,
    },
    { label: "Eliminar", type: "dropdown", icon: <Trash2 className="w-4 h-4 text-red-500" />, onClick: (row) => openPanel(UsersPanel.Delete, row) },
  ];

  const fetchUsers = useCallback(
    async (page: number = 0, size: number = 10) => {
      setLoading(true);
      try {
        const response = await UserService.getUsers(page, size, filters.active, branchId, filters.q);
        setUsers(response);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al cargar usuarios";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [branchId, filters]
  );

  // Reset de página al cambiar filtros o sucursal
  useEffect(() => {
    setPageIndex(0);
  }, [filters, branchId]);

  // Cargar datos
  useEffect(() => {
    fetchUsers(pageIndex, pageSize);
  }, [fetchUsers, pageIndex, pageSize, refreshKey]);

  const closePanel = () => setActivePanel(null);

  const refreshTable = () => fetchUsers(pageIndex, pageSize);

  const handleStatusChange = async (active: boolean) => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await UserService.updateUserStatus(selectedUser.userId, active);
      toast.success(active ? "Usuario activado" : "Usuario desactivado");
      closePanel();
      refreshTable();
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "No pudimos actualizar el estado del usuario";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await UserService.deleteUser(selectedUser.userId);
      toast.success("Usuario eliminado correctamente");
      closePanel();
      refreshTable();
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "No se pudo eliminar el usuario";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full space-y-4">
      <UsersFilters
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

      <DataTable<UserSummaryResponse>
        pageData={users}
        columns={usersColumns}
        actions={usersActions}
        pageIndex={users.currentPage ?? pageIndex}
        pageSize={users.pageSize ?? pageSize}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPageIndex(0);
        }}
        loading={loading}
      />

      <Dialog open={activePanel === UsersPanel.View} onOpenChange={closePanel}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del usuario</DialogTitle>
            <DialogDescription>Consulta la información completa del colaborador y sus roles.</DialogDescription>
          </DialogHeader>
          {selectedUser && <UserDetail userId={selectedUser.userId} />}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={activePanel === UsersPanel.Disable}
        onClose={closePanel}
        title="¿Desactivar usuario?"
        description={
          <>
            El usuario <strong>{selectedUser?.fullName}</strong> no podrá iniciar sesión ni acceder a módulos.
          </>
        }
        onConfirm={() => handleStatusChange(false)}
        confirmText="Desactivar"
        confirmVariant="destructive"
      />

      <ConfirmationDialog
        open={activePanel === UsersPanel.Activate}
        onClose={closePanel}
        title="¿Activar usuario?"
        description={
          <>
            El usuario <strong>{selectedUser?.fullName}</strong> podrá volver a acceder al sistema.
          </>
        }
        onConfirm={() => handleStatusChange(true)}
        confirmText="Activar"
      />

      <ConfirmationDialog
        open={activePanel === UsersPanel.Delete}
        onClose={closePanel}
        title="¿Eliminar usuario permanentemente?"
        description={
          <>
            Se eliminará la cuenta asociada a <strong>{selectedUser?.fullName}</strong>. Solo es posible si no tiene relaciones activas.
          </>
        }
        tooltipMessage="Verifica que el empleado no tenga sucursales asignadas."
        onConfirm={handleDeleteUser}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />
    </div>
  );
}
