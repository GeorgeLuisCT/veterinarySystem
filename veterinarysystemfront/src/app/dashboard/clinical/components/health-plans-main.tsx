"use client";

import * as React from "react";
import { Edit, Trash2, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { PaginatedResponse } from "@/types/paginated-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import DataTable from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { PageSection } from "@/components/page/page-section";

import HealthPlanService from "../service/health-plan-service";
import { HealthPlanResponse } from "../types/health-plan-response";
import HealthPlanForm from "./health-plan-form";

type ActiveModal = "create" | "edit" | null;

export function HealthPlansMain() {
  const { toast } = useToast();

  const [pageData, setPageData] = React.useState<PaginatedResponse<HealthPlanResponse> | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [activeModal, setActiveModal] = React.useState<ActiveModal>(null);
  const [planForEdit, setPlanForEdit] = React.useState<HealthPlanResponse | null>(null);
  const [planDeleteId, setPlanDeleteId] = React.useState<number | null>(null);
  const [planPendingDelete, setPlanPendingDelete] = React.useState<HealthPlanResponse | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await HealthPlanService.list({
        page: pageIndex,
        size: pageSize,
        q: searchQuery || undefined,
      });
      setPageData(response);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(err) ?? "No se pudieron cargar los planes de salud.",
      });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, searchQuery, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPageIndex(0);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleFormSuccess = React.useCallback(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = React.useCallback(() => setActiveModal("create"), []);

  const openEditModal = React.useCallback((plan: HealthPlanResponse) => {
    setPlanForEdit(plan);
    setActiveModal("edit");
  }, []);

  const closeModal = React.useCallback(() => {
    setActiveModal(null);
    setPlanForEdit(null);
  }, []);

  const openDeleteConfirm = React.useCallback((plan: HealthPlanResponse) => {
    setPlanDeleteId(plan.id);
    setPlanPendingDelete(plan);
  }, []);

  const closeDeleteConfirm = React.useCallback(() => {
    setPlanDeleteId(null);
    setPlanPendingDelete(null);
  }, []);

  const handleDelete = React.useCallback(async () => {
    if (!planDeleteId) return;
    try {
      await HealthPlanService.delete(planDeleteId);
      toast({
        variant: "default",
        title: "Plan eliminado",
        description: "El plan de salud se eliminó exitosamente.",
      });
      closeDeleteConfirm();
      if (pageData?.content.length === 1 && pageIndex > 0) {
        setPageIndex(pageIndex - 1);
      } else {
        fetchData();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudo eliminar el plan.",
      });
    }
  }, [fetchData, pageData, pageIndex, planDeleteId, toast, closeDeleteConfirm]);

  const actions = React.useMemo(
    () => [
      {
        label: "Editar",
        type: "direct" as const,
        icon: <Edit className="h-4 w-4" />,
        onClick: (plan: HealthPlanResponse) => openEditModal(plan),
      },
      {
        label: "Eliminar",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: (plan: HealthPlanResponse) => openDeleteConfirm(plan),
      },
    ],
    [openEditModal, openDeleteConfirm]
  );

  const columns = React.useMemo<ColumnDef<HealthPlanResponse>[]>(
    () => [
      {
        id: "name",
        header: "Plan",
        cell: ({ row }) => (
          <div className="min-w-48 py-2">
            <div className="font-medium text-foreground">{row.original.name}</div>
            {row.original.description && (
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "services",
        header: "Servicios incluidos",
        cell: ({ row }) => {
          const items = row.original.serviceItems;
          if (items.length === 0) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="py-2 text-sm">
              <span className="font-medium">
                {items.length} {items.length === 1 ? "servicio" : "servicios"}
              </span>
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {items
                  .map((i) =>
                    i.quantity > 1
                      ? `${i.clinicalServiceName} ×${i.quantity}`
                      : i.clinicalServiceName
                  )
                  .join(", ")}
              </div>
            </div>
          );
        },
      },
      {
        id: "price",
        header: () => <div className="text-right">Precio</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums">
            S/ {Number(row.original.price ?? 0).toFixed(2)}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <PageSection
      title="Planes de salud"
      description="Administra los paquetes de servicios ofrecidos a tus clientes."
      className="h-full"
      actions={
        <Button onClick={openCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear plan
        </Button>
      }
    >
      <div className="h-full">
        <DataTable<HealthPlanResponse>
          pageData={pageData}
          columns={columns}
          actions={actions}
          loading={loading}
          onSearch={handleSearch}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={handlePageSizeChange}
          searchPlaceholder="Buscar por nombre…"
          getRowKey={(plan) => plan.id}
          emptyState={<div className="text-muted-foreground">No hay planes registrados.</div>}
        />

        <Dialog open={activeModal === "create"} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Crear plan de salud</DialogTitle>
              <DialogDescription>
                Define los servicios incluidos y el precio del nuevo plan de salud.
              </DialogDescription>
            </DialogHeader>
            <HealthPlanForm setOpen={closeModal} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "edit"} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar plan de salud</DialogTitle>
              <DialogDescription>
                Actualiza la información y los servicios asociados al plan.
              </DialogDescription>
            </DialogHeader>
            {planForEdit && (
              <HealthPlanForm
                setOpen={closeModal}
                planId={planForEdit.id}
                onSuccess={handleFormSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={!!planDeleteId}
          onClose={closeDeleteConfirm}
          title="¿Eliminar plan de salud?"
          description={
            <span>
              Esta acción eliminará{" "}
              <strong>{planPendingDelete?.name ?? "el plan seleccionado"}</strong> de forma
              definitiva. ¿Deseas continuar?
            </span>
          }
          confirmText="Eliminar"
          confirmVariant="destructive"
          onConfirm={handleDelete}
        />
      </div>
    </PageSection>
  );
}

export default HealthPlansMain;
