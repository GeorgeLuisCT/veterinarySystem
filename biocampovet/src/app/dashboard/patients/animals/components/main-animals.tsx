"use client";

import { useState, useEffect, useMemo } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import AnimalService from "../service/animal-service";
import { Ban, Eye, Pencil, Trash2 } from "lucide-react";
import { useAnimalContext } from "../context/animal-context";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { AnimalForm } from "../form/animal-form";
import { AnimalDetail } from "../components/animal-detail";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AnimalSummaryResponse } from "../types/animal-summary-response";
import { getAaxiosErrorMessage } from "@/helpers/error";

enum AnimalPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
}

export default function MainAnimals() {
  const { animals, setAnimals, removeAnimal } = useAnimalContext();

  const [loading, setLoading] = useState(false);

  const [selectedAnimal, setSelectedAnimal] = useState<AnimalSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<AnimalPanel | null>(null);

  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

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
      { accessorKey: "birthDate", header: "Fecha de Nacimiento" },
      { accessorKey: "ownerName", header: "Dueño" },
    ],
    []
  );

  const animalActions: Action<AnimalSummaryResponse>[] = [
    {
      label: "Ver",
      type: "direct",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => openPanel(AnimalPanel.View, row),
    },
    {
      label: "Editar",
      type: "direct",
      icon: <Pencil className="w-4 h-4" />,
      onClick: (row) => openPanel(AnimalPanel.Edit, row),
    },
    {
      label: "Desactivar",
      type: "dropdown",
      icon: <Ban className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(AnimalPanel.Disable, row),
    },
    {
      label: "Eliminar",
      type: "dropdown",
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(AnimalPanel.Delete, row),
    },
  ];

  useEffect(() => {
    fetchAnimals(0, 10, searchQuery);
  }, [searchQuery]);

  const fetchAnimals = async (page: number = 0, pageSize: number = 10, query?: string) => {
    setLoading(true);
    try {
      const response = await AnimalService.getAnimals({
        page,
        size: pageSize,
        active: true,
        query,
      });
      setAnimals(response);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar animales";
      toast.error(message);
      console.error("Error fetching animals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableAnimal = async () => {
    if (selectedAnimal) {
      setLoading(true);
      try {
        await AnimalService.softDeleteAnimal(selectedAnimal.id);
        removeAnimal(selectedAnimal.id);
        toast.success(`El animal ${selectedAnimal.name} ha sido desactivado`);
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al desactivar el animal";
        toast.error(message);
        console.error("Error disabling animal:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAnimal = async () => {
    if (selectedAnimal) {
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
    }
  };

  return (
    <div className="h-full">
      <DataTable<AnimalSummaryResponse>
        pageData={animals}
        columns={animalColumns}
        actions={animalActions}
        onSearch={setSearchQuery}
        pageIndex={animals.currentPage}
        pageSize={animals.pageSize}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        loading={loading}
      />

      <Dialog open={activePanel === AnimalPanel.Edit} onOpenChange={() => setActivePanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Animal</DialogTitle>
            <DialogDescription>
              Modifica los datos del animal. Los cambios se aplicarán globalmente.
            </DialogDescription>
          </DialogHeader>
          {selectedAnimal && (
            <AnimalForm animalId={selectedAnimal.id} setOpen={() => setActivePanel(null)} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={activePanel === AnimalPanel.Disable}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de deshabilitar este animal?"
        description={
          <>
            Al deshabilitar <strong>{selectedAnimal?.name}</strong>, no podrá ser seleccionado en
            servicios o registros.
          </>
        }
        tooltipMessage="Esta acción no afectará registros históricos de procedimientos."
        onConfirm={handleDisableAnimal}
        confirmText="Estoy seguro"
      />

      <ConfirmationDialog
        open={activePanel === AnimalPanel.Delete}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de eliminar este animal?"
        description={
          <>
            Al eliminar <strong>{selectedAnimal?.name}</strong>, desaparecerá del sistema y no
            podrás recuperarlo.
          </>
        }
        tooltipMessage="Esta acción no afectará registros históricos de procedimientos."
        onConfirm={handleDeleteAnimal}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />

      <Dialog open={activePanel === AnimalPanel.View} onOpenChange={() => setActivePanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Animal</DialogTitle>
            <DialogDescription>
              Visualiza la información registrada de este animal.
            </DialogDescription>
          </DialogHeader>
          {selectedAnimal && <AnimalDetail animalId={selectedAnimal.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
