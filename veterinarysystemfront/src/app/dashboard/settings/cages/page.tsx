"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, PlusCircle, Trash2 } from "lucide-react";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { NewCageModal } from "@/app/dashboard/clinical/components/hospitalization/add-cage-modal";
import { DeleteCageModal } from "@/app/dashboard/clinical/components/hospitalization/delete-cage-modal";
import { EditCageModal } from "@/app/dashboard/clinical/components/hospitalization/edit-cage-modal";
import { CageSizeLabels } from "@/app/dashboard/clinical/enums/cage-size";
import CageService from "@/app/dashboard/clinical/service/cage-service";
import type { CageResponse } from "@/app/dashboard/clinical/types/cage-response";
import DataTable, { type Action } from "@/components/data-table";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SETTINGS_URL } from "@/config/settings";
import { useUser } from "@/context/user-context";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useToast } from "@/hooks/use-toast";
import type { PaginatedResponse } from "@/types/paginated-response";

const EMPTY: PaginatedResponse<CageResponse> = { content: [], totalPages: 0, totalElements: 0, pageSize: 10, currentPage: 0 };

/** Jaulas de hospitalización de la sucursal (el tablero de Hospitalización solo las usa). */
export default function CagesSettingsPage() {
  const { toast } = useToast();
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id || undefined;

  const [pageData, setPageData] = React.useState<PaginatedResponse<CageResponse>>(EMPTY);
  const [loading, setLoading] = React.useState(false);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [name, setName] = React.useState("");

  const [openCreate, setOpenCreate] = React.useState(false);
  const [cageToEdit, setCageToEdit] = React.useState<CageResponse | null>(null);
  const [cageToDelete, setCageToDelete] = React.useState<CageResponse | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setPageData(await CageService.list({ branchId, name: name || undefined, page: pageIndex, pageSize }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudieron cargar las jaulas.",
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, name, pageIndex, pageSize, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnDef<CageResponse>[] = React.useMemo(
    () => [
      { accessorKey: "name", header: "Nombre" },
      { id: "size", header: "Tamaño", cell: ({ row }) => CageSizeLabels[row.original.size] ?? row.original.size },
      { accessorKey: "branchName", header: "Sucursal" },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) =>
          row.original.occupied ? (
            <Badge variant="outline" className="text-amber-600">
              Ocupada
            </Badge>
          ) : (
            <Badge variant="outline" className="text-success-strong">
              Libre
            </Badge>
          ),
      },
    ],
    []
  );

  const actions: Action<CageResponse>[] = [
    { label: "Editar", type: "direct", icon: <Edit className="h-4 w-4" />, onClick: setCageToEdit },
    {
      label: "Eliminar",
      type: "direct",
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: setCageToDelete,
      isDisabled: (row) => row.occupied,
    },
  ];

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          backHref={SETTINGS_URL}
          backLabel="Configuración"
          title="Jaulas"
          description="Las jaulas de hospitalización de la sucursal. Una jaula ocupada no se puede eliminar."
          actions={
            <Button onClick={() => setOpenCreate(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Nueva jaula
            </Button>
          }
        />

        <DataTable<CageResponse>
          pageData={pageData}
          columns={columns}
          actions={actions}
          loading={loading}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageIndex(0);
            setPageSize(size);
          }}
          onSearch={(q) => {
            setPageIndex(0);
            setName(q.trim());
          }}
          searchPlaceholder="Buscar jaula..."
          getRowKey={(row) => row.id}
          emptyState={<span className="text-muted-foreground">No hay jaulas registradas en esta sucursal.</span>}
        />

        <NewCageModal open={openCreate} onOpenChange={setOpenCreate} onSuccess={() => void load()} />
        <EditCageModal
          open={!!cageToEdit}
          onOpenChange={(open) => !open && setCageToEdit(null)}
          onSuccess={() => void load()}
          cageToEdit={cageToEdit}
        />
        <DeleteCageModal
          open={!!cageToDelete}
          onOpenChange={(open) => !open && setCageToDelete(null)}
          onSuccess={() => void load()}
          cageToDelete={cageToDelete}
        />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
