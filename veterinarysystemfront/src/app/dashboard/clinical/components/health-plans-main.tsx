"use client";

import * as React from "react";
import { Edit, Trash2, PlusCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import PaginatedCardList from "@/components/paginated-card-list";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import HealthPlanService from "../service/health-plan-service";
import { HealthPlanResponse } from "../types/health-plan-response";
import HealthPlanForm from "./health-plan-form";

type ActiveModal = "create" | "edit" | null;

export function HealthPlansMain() {
  const { toast } = useToast();

  const [pageData, setPageData] = React.useState<PaginatedResponse<HealthPlanResponse> | null>(null);
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

  const renderCard = React.useCallback(
    (plan: HealthPlanResponse) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
            {plan.description && (
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-base font-semibold">
            S/ {Number(plan.price ?? 0).toFixed(2)}
          </Badge>
        </div>

        {plan.notes && (
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Notas</h4>
            <p className="text-sm leading-6 text-foreground">{plan.notes}</p>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">
            Servicios incluidos
          </h4>
          {plan.serviceItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay servicios asociados.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {plan.serviceItems.map((item) => (
                <div key={item.id} className="rounded-md border border-dashed border-border p-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{item.clinicalServiceName}</span>
                    </div>
                    <Badge variant="secondary">Cantidad: {item.quantity}</Badge>
                  </div>
                  {item.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">Notas: {item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    []
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Planes de Salud</CardTitle>
          <CardDescription>Administra los paquetes de servicios ofrecidos a tus clientes.</CardDescription>
        </div>
        <Button onClick={openCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear plan
        </Button>
      </CardHeader>
      <CardContent className="h-full">
        <PaginatedCardList<HealthPlanResponse>
          pageData={pageData}
          actions={actions}
          loading={loading}
          onSearch={handleSearch}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={handlePageSizeChange}
          searchPlaceholder="Buscar por nombre…"
          getItemKey={(plan) => plan.id}
          renderCard={renderCard}
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
      </CardContent>
    </Card>
  );
}

export default HealthPlansMain;
