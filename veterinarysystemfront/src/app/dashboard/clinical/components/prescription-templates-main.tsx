"use client";

import * as React from "react";
import { Edit, Eye, Trash2, PlusCircle } from "lucide-react";

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
import { PrescriptionTemplateDetail } from "./prescription-template-detail";

import PrescriptionTemplateService from "../service/prescription-template-service";
import { PrescriptionTemplateResponse } from "../types/prescription-template-response";
import PrescriptionTemplateForm from "./prescription-template-form";

type ActiveModal = "create" | "edit" | "view" | null;

export function PrescriptionTemplatesMain() {
  const { toast } = useToast();

  const [pageData, setPageData] =
    React.useState<PaginatedResponse<PrescriptionTemplateResponse> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [activeModal, setActiveModal] = React.useState<ActiveModal>(null);
  const [templateForEdit, setTemplateForEdit] = React.useState<PrescriptionTemplateResponse | null>(
    null
  );
  const [templateDeleteId, setTemplateDeleteId] = React.useState<number | null>(null);
  const [templatePendingDelete, setTemplatePendingDelete] =
    React.useState<PrescriptionTemplateResponse | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await PrescriptionTemplateService.list({
        page: pageIndex,
        size: pageSize,
        q: searchQuery || undefined,
      });
      setPageData(response);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(err) ?? "No se pudieron cargar las plantillas.",
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

  const openViewModal = React.useCallback((template: PrescriptionTemplateResponse) => {
    setTemplateForEdit(template);
    setActiveModal("view");
  }, []);

  const openEditModal = React.useCallback((template: PrescriptionTemplateResponse) => {
    setTemplateForEdit(template);
    setActiveModal("edit");
  }, []);

  const closeModal = React.useCallback(() => {
    setActiveModal(null);
    setTemplateForEdit(null);
  }, []);

  const openDeleteConfirm = React.useCallback((template: PrescriptionTemplateResponse) => {
    setTemplateDeleteId(template.id);
    setTemplatePendingDelete(template);
  }, []);

  const closeDeleteConfirm = React.useCallback(() => {
    setTemplateDeleteId(null);
    setTemplatePendingDelete(null);
  }, []);

  const handleDelete = React.useCallback(async () => {
    if (!templateDeleteId) return;
    try {
      await PrescriptionTemplateService.delete(templateDeleteId);
      toast({
        variant: "default",
        title: "Plantilla eliminada",
        description: "La plantilla de prescripción se eliminó exitosamente.",
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
        description: getAaxiosErrorMessage(error) ?? "No se pudo eliminar la plantilla.",
      });
    }
  }, [fetchData, pageData, pageIndex, templateDeleteId, toast, closeDeleteConfirm]);

  const actions = React.useMemo(
    () => [
      {
        label: "Ver detalle",
        type: "direct" as const,
        icon: <Eye className="h-4 w-4" />,
        onClick: (template: PrescriptionTemplateResponse) => openViewModal(template),
      },
      {
        label: "Editar",
        type: "direct" as const,
        icon: <Edit className="h-4 w-4" />,
        onClick: (template: PrescriptionTemplateResponse) => openEditModal(template),
      },
      {
        label: "Eliminar",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: (template: PrescriptionTemplateResponse) => openDeleteConfirm(template),
      },
    ],
    [openViewModal, openEditModal, openDeleteConfirm]
  );

  const columns = React.useMemo<ColumnDef<PrescriptionTemplateResponse>[]>(
    () => [
      {
        id: "name",
        header: "Plantilla",
        cell: ({ row }) => (
          <div className="min-w-48 py-2">
            <div className="font-medium text-foreground">{row.original.name}</div>
            <div className="line-clamp-1 text-xs text-muted-foreground">{row.original.purpose}</div>
          </div>
        ),
      },
      {
        id: "medications",
        header: "Medicamentos",
        cell: ({ row }) => {
          const meds = row.original.medications;
          if (meds.length === 0) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="py-2 text-sm">
              <span className="font-medium">
                {meds.length} {meds.length === 1 ? "medicamento" : "medicamentos"}
              </span>
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {meds
                  .map((m) => m.productName ?? m.customMedicationName ?? "Personalizado")
                  .join(", ")}
              </div>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <PageSection
      title="Plantillas de prescripción"
      description="Ahorrar tiempo creando esquemas de tratamiento reutilizables."
      className="h-full"
      actions={
        <Button onClick={openCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear plantilla
        </Button>
      }
    >
      <div className="h-full">
        <DataTable<PrescriptionTemplateResponse>
          pageData={pageData}
          columns={columns}
          actions={actions}
          loading={loading}
          onSearch={handleSearch}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={handlePageSizeChange}
          searchPlaceholder="Buscar por nombre o propósito…"
          getRowKey={(template) => template.id}
          emptyState={<div className="text-muted-foreground">No hay plantillas registradas.</div>}
        />

        <Dialog open={activeModal === "create"} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Crear plantilla de prescripción</DialogTitle>
              <DialogDescription>
                Define una plantilla para reutilizar tratamientos frecuentes en tu clínica.
              </DialogDescription>
            </DialogHeader>
            <PrescriptionTemplateForm setOpen={closeModal} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "view"} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{templateForEdit?.name ?? "Detalle de plantilla"}</DialogTitle>
              <DialogDescription>Medicamentos y notas de la plantilla.</DialogDescription>
            </DialogHeader>
            {templateForEdit && <PrescriptionTemplateDetail templateId={templateForEdit.id} />}
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "edit"} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar plantilla de prescripción</DialogTitle>
              <DialogDescription>
                Actualiza la información y medicamentos asociados a la plantilla.
              </DialogDescription>
            </DialogHeader>
            {templateForEdit && (
              <PrescriptionTemplateForm
                setOpen={closeModal}
                templateId={templateForEdit.id}
                onSuccess={handleFormSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={!!templateDeleteId}
          onClose={closeDeleteConfirm}
          title="¿Eliminar plantilla?"
          description={
            <span>
              Esta acción eliminará{" "}
              <strong>{templatePendingDelete?.name ?? "la plantilla seleccionada"}</strong> de forma
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

export default PrescriptionTemplatesMain;
