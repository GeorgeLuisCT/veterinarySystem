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

import PrescriptionTemplateService from "../service/prescription-template-service";
import {
  PrescriptionTemplateResponse,
} from "../types/prescription-template-response";
import PrescriptionTemplateForm from "./prescription-template-form";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { FrequencyUnitLabels } from "../enums/frequency-unit";
import { TimeUnit } from "@/enums/time-unit";

type ActiveModal = "create" | "edit" | null;

const timeUnitLabels: Record<TimeUnit, string> = {
  [TimeUnit.DAYS]: "días",
  [TimeUnit.WEEKS]: "semanas",
  [TimeUnit.MONTHS]: "meses",
};

export function PrescriptionTemplatesMain() {
  const { toast } = useToast();

  const [pageData, setPageData] = React.useState<PaginatedResponse<PrescriptionTemplateResponse> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [activeModal, setActiveModal] = React.useState<ActiveModal>(null);
  const [templateForEdit, setTemplateForEdit] = React.useState<PrescriptionTemplateResponse | null>(null);
  const [templateDeleteId, setTemplateDeleteId] = React.useState<number | null>(null);
  const [templatePendingDelete, setTemplatePendingDelete] = React.useState<PrescriptionTemplateResponse | null>(null);

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
    [openEditModal, openDeleteConfirm]
  );

  const renderMedication = React.useCallback(
    (medication: PrescriptionTemplateResponse["medications"][number]) => {
      const label = medication.productName
        ? medication.productName
        : medication.customMedicationName ?? "Medicamento personalizado";
      const dosageUnitLabel = medication.dosageUnit
        ? ProductUnitTypeLabels[medication.dosageUnit] ?? medication.dosageUnit
        : undefined;
      const frequencyLabel = `${medication.frequencyValue} ${FrequencyUnitLabels[medication.frequencyUnit]}`;
      const durationLabel = `${medication.durationValue} ${
        timeUnitLabels[medication.durationUnit] ?? medication.durationUnit
      }`;

      return (
        <div
          key={medication.id}
          className="rounded-md border border-dashed border-border p-3"
        >
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">{label}</span>
              {medication.productId && (
                <span className="text-xs text-muted-foreground">Producto del inventario (ID: {medication.productId})</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Dosis: {medication.dosageAmount}
                {dosageUnitLabel ? ` ${dosageUnitLabel}` : ""}
              </Badge>
              <Badge variant="secondary">Cada {frequencyLabel}</Badge>
              <Badge variant="secondary">Por {durationLabel}</Badge>
            </div>
          </div>
          {medication.instructions && (
            <p className="mt-2 text-sm text-muted-foreground">
              Instrucciones: {medication.instructions}
            </p>
          )}
        </div>
      );
    },
    []
  );

  const renderCard = React.useCallback(
    (template: PrescriptionTemplateResponse) => (
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
          <p className="text-sm text-muted-foreground">{template.purpose}</p>
        </div>

        {template.notes && (
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Notas generales</h4>
            <p className="text-sm leading-6 text-foreground">{template.notes}</p>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Medicamentos</h4>
          <div className="flex flex-col gap-2">
            {template.medications.map((medication) => renderMedication(medication))}
          </div>
        </div>
      </div>
    ),
    [renderMedication]
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Plantillas de Prescripciones Médicas</CardTitle>
          <CardDescription>Ahorrar tiempo creando esquemas de tratamiento reutilizables.</CardDescription>
        </div>
        <Button onClick={openCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear plantilla
        </Button>
      </CardHeader>
      <CardContent className="h-full">
        <PaginatedCardList<PrescriptionTemplateResponse>
          pageData={pageData}
          actions={actions}
          loading={loading}
          onSearch={handleSearch}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={handlePageSizeChange}
          searchPlaceholder="Buscar por nombre o propósito…"
          getItemKey={(template) => template.id}
          renderCard={renderCard}
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
      </CardContent>
    </Card>
  );
}

export default PrescriptionTemplatesMain;
