"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import AnimalService from "../service/animal-service";
import { Ban, Eye, Pencil, Trash2, RotateCcw } from "lucide-react";
import { useAnimalContext } from "../context/animal-context";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { AnimalForm } from "../form/animal-form";
import { AnimalDetail } from "./animal-detail";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AnimalSummaryResponse } from "../types/animal-summary-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import AnimalFilters, { AnimalFiltersShape } from "./animal-filters";

enum AnimalPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
  Restore = "restore",
}

const DEFAULT_FILTERS: AnimalFiltersShape = {
  q: undefined,
  active: true, // API requiere boolean
};

export default function MainAnimals() {
  const { animals, setAnimals, removeAnimal } = useAnimalContext();

  const [loading, setLoading] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<AnimalPanel | null>(null);

  const [filters, setFilters] = useState<AnimalFiltersShape>(DEFAULT_FILTERS);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const openPanel = (panel: AnimalPanel, animal: AnimalSummaryResponse) => {
    setSelectedAnimal(animal);
    setActivePanel(panel);
  };

  const animalColumns: ColumnDef<AnimalSummaryResponse>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Nombre" },
      { accessorKey: "speciesName", header: "Especie" },
      { accessorKey: "breed", header: "Raza" },
      { accessorKey: "birthDate", header: "Fecha de nacimiento" },
      { accessorKey: "ownerName", header: "Dueño" },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => {
          const active = row.original.isActive ?? true;
          return (
            <Badge variant="outline" className={active ? "text-success-strong" : "text-muted-foreground"}>
              {active ? "Activo" : "Inactivo"}
            </Badge>
          );
        },
      },
    ],
    []
  );

  const animalActions: Action<AnimalSummaryResponse>[] = [
    { label: "Ver", type: "direct", icon: <Eye className="w-4 h-4" />, onClick: (row) => openPanel(AnimalPanel.View, row) },
    { label: "Editar", type: "direct", icon: <Pencil className="w-4 h-4" />, onClick: (row) => openPanel(AnimalPanel.Edit, row) },
    {
      label: "Desactivar",
      type: "dropdown",
      icon: <Ban className="w-4 h-4 text-red-500" />,
      onClick: (row) => {
        if (row.isActive === false) {
          openPanel(AnimalPanel.Restore, row);
        } else {
          openPanel(AnimalPanel.Disable, row);
        }
      },
    },
    { label: "Reactivar", type: "dropdown", icon: <RotateCcw className="w-4 h-4" />, onClick: (row) => openPanel(AnimalPanel.Restore, row) },
    { label: "Eliminar", type: "dropdown", icon: <Trash2 className="w-4 h-4 text-red-500" />, onClick: (row) => openPanel(AnimalPanel.Delete, row) },
  ];

  const fetchAnimals = useCallback(async (page = 0, size = 10) => {
    setLoading(true);
    try {
      const response = await AnimalService.getAnimals({
        page,
        size,
        active: filters.active,            // requerido
        query: filters.q ?? undefined,     // buscador desde filtros
      });
      setAnimals(response);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar animales";
      toast.error(message);
      console.error("Error fetching animals:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, setAnimals]);

  useEffect(() => {
    setPageIndex(0);
  }, [filters]);

  useEffect(() => {
    fetchAnimals(pageIndex, pageSize);
  }, [fetchAnimals, pageIndex, pageSize]);

  const handleDisableAnimal = async () => {
    if (!selectedAnimal) return;
    setLoading(true);
    try {
      await AnimalService.softDeleteAnimal(selectedAnimal.id);
      toast.success(`El animal ${selectedAnimal.name} ha sido desactivado`);
      setActivePanel(null);
      fetchAnimals(pageIndex, pageSize);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al desactivar el animal";
      toast.error(message);
      console.error("Error disabling animal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreAnimal = async () => {
    if (!selectedAnimal) return;
    setLoading(true);
    try {
      // Asegúrate de tener este endpoint
      await AnimalService.restoreAnimal(selectedAnimal.id);
      toast.success(`El animal ${selectedAnimal.name} ha sido reactivado`);
      setActivePanel(null);
      fetchAnimals(pageIndex, pageSize);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al reactivar el animal";
      toast.error(message);
      console.error("Error restoring animal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnimal = async () => {
    if (!selectedAnimal) return;
    setLoading(true);
    try {
      await AnimalService.hardDeleteAnimal(selectedAnimal.id);
      removeAnimal(selectedAnimal.id);
      setActivePanel(null);
      toast.success("Animal eliminado correctamente");
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al eliminar el animal";
      toast.error(message);
      console.error("Error deleting animal:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full space-y-4">
      {/* Filtros separados */}
      <AnimalFilters
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

      <DataTable<AnimalSummaryResponse>
        pageData={animals}
        columns={animalColumns}
        actions={animalActions}
        pageIndex={animals.currentPage}
        pageSize={animals.pageSize}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }}
        loading={loading}
      />

      {/* Editar */}
      <Dialog open={activePanel === AnimalPanel.Edit} onOpenChange={() => setActivePanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Animal</DialogTitle>
            <DialogDescription>Modifica los datos del animal.</DialogDescription>
          </DialogHeader>
          {selectedAnimal && (
            <AnimalForm animalId={selectedAnimal.id} setOpen={() => setActivePanel(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Ver */}
      <Dialog open={activePanel === AnimalPanel.View} onOpenChange={() => setActivePanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Animal</DialogTitle>
            <DialogDescription>Visualiza la información registrada.</DialogDescription>
          </DialogHeader>
          {selectedAnimal && <AnimalDetail animalId={selectedAnimal.id} />}
        </DialogContent>
      </Dialog>

      {/* Desactivar */}
      <ConfirmationDialog
        open={activePanel === AnimalPanel.Disable}
        onClose={() => setActivePanel(null)}
        title="¿Deshabilitar este animal?"
        description={
          <>Al deshabilitar <strong>{selectedAnimal?.name}</strong>, no podrá seleccionarse en servicios o registros.</>
        }
        tooltipMessage="No afectará registros históricos."
        onConfirm={handleDisableAnimal}
        confirmText="Estoy seguro"
      />

      {/* Reactivar */}
      <ConfirmationDialog
        open={activePanel === AnimalPanel.Restore}
        onClose={() => setActivePanel(null)}
        title="¿Reactivar este animal?"
        description={
          <>Al reactivar a <strong>{selectedAnimal?.name}</strong>, volverá a estar disponible para su selección.</>
        }
        onConfirm={handleRestoreAnimal}
        confirmText="Reactivar"
      />

      {/* Eliminar */}
      <ConfirmationDialog
        open={activePanel === AnimalPanel.Delete}
        onClose={() => setActivePanel(null)}
        title="¿Eliminar este animal?"
        description={
          <>Al eliminar <strong>{selectedAnimal?.name}</strong>, desaparecerá del sistema y no podrás recuperarlo.</>
        }
        tooltipMessage="No afectará registros históricos."
        onConfirm={handleDeleteAnimal}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />
    </div>
  );
}
