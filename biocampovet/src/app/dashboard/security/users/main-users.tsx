"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Ban, Eye, Pencil, Trash2 } from "lucide-react";

import UserSerivce from "./service/users-service"; // se mantiene como en tu import
import { UserSummaryResponse } from "./types/user-summary-response";
import { PaginatedResponse } from "@/types/paginated-response";
import { Badge } from "@/components/ui/badge";
import UsersFilters, { UsersFiltersShape } from "./components/users-filters";

enum UsersPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
}

type Props = { branchId: number };

const DEFAULT_FILTERS: UsersFiltersShape = {
  q: undefined,
  active: true,
};

export default function MainUsers({ branchId }: Props) {
  // Estado paginado
  const [users, setUsers] = useState<PaginatedResponse<UserSummaryResponse>>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
    currentPage: 0,
  });

  const [loading, setLoading] = useState(false);

  // (Cuando agregues formularios/detalles, habilita estos)
  // const [selectedUser, setSelectedUser] = useState<UserSummaryResponse | null>(null);
  // const [activePanel, setActivePanel] = useState<UsersPanel | null>(null);

  const [filters, setFilters] = useState<UsersFiltersShape>(DEFAULT_FILTERS);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const openPanel = (panel: UsersPanel, user: UserSummaryResponse) => {
    console.log(panel, user);
    // setSelectedUser(user);
    // setActivePanel(panel);
  };

  const usersColumns: ColumnDef<UserSummaryResponse>[] = useMemo(() => {
    const columns: ColumnDef<UserSummaryResponse>[] = [
      { accessorKey: "fullName", header: "Nombre" },
      { accessorKey: "email", header: "Correo" },
      { accessorKey: "phoneNumber", header: "Teléfono" },
      { accessorKey: "burden", header: "Cargo" },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => {
          const active = row.original ?? true;
          return (
            <Badge variant="outline" className={active ? "text-emerald-700" : "text-zinc-500"}>
              {active ? "Activo" : "Inactivo"}
            </Badge>
          );
        },
      },
    ];

    if (branchId === 0) {
      columns.splice(columns.length - 1, 0, {
        accessorKey: "branchNames",
        header: "Disponible en",
      });
    }

    return columns;
  }, [branchId]);

  const usersActions: Action<UserSummaryResponse>[] = [
    { label: "Ver", type: "direct", icon: <Eye className="w-4 h-4" />, onClick: (row) => openPanel(UsersPanel.View, row) },
    { label: "Editar", type: "direct", icon: <Pencil className="w-4 h-4" />, onClick: (row) => openPanel(UsersPanel.Edit, row) },
    { label: "Desactivar", type: "dropdown", icon: <Ban className="w-4 h-4 text-red-500" />, onClick: (row) => openPanel(UsersPanel.Disable, row) },
    { label: "Eliminar", type: "dropdown", icon: <Trash2 className="w-4 h-4 text-red-500" />, onClick: (row) => openPanel(UsersPanel.Delete, row) },
  ];

  const fetchUsers = useCallback(
    async (page: number = 0, size: number = 10) => {
      setLoading(true);
      try {
        // Firma asumida: getUsers(page, size, active, branchId, query?)
        const response = await UserSerivce.getUsers(page, size, filters.active, branchId);
        setUsers(response);
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
  }, [fetchUsers, pageIndex, pageSize]);

  return (
    <div className="h-full space-y-4">
      {/* Filtros separados (buscador + estado) */}
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

      {/* Cuando tengas formularios y vistas, replica los diálogos como en Clientes/Animales */}
      {/*
      <Dialog open={activePanel === UsersPanel.Edit} onOpenChange={() => setActivePanel(null)}>
        <DialogContent>...</DialogContent>
      </Dialog>
      */}
    </div>
  );
}
