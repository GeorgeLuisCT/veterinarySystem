"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import AnimalService from "../service/animal-service";
import { RotateCw, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useAnimalContext } from "../context/animal-context";
import { toast } from "sonner";
import { AnimalSummaryResponse } from "../types/animal-summary-response";
import { getAaxiosErrorMessage } from "@/helpers/error";

enum AnimalPanel {
  Enable = "enable",
  Delete = "delete",
}

export default function ManageInactiveAnimals() {
  const { addAnimal } = useAnimalContext();

  const [inactiveAnimals, setInactiveAnimals] = useState<AnimalSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedAnimal, setSelectedAnimal] = useState<AnimalSummaryResponse | null>(null);
  const [activePanel, setActivePanel] = useState<AnimalPanel | null>(null);

  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

  const openPanel = (panel: AnimalPanel, animal: AnimalSummaryResponse) => {
    setSelectedAnimal(animal);
    setActivePanel(panel);
  };

  const animalColumns: ColumnDef<AnimalSummaryResponse>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Nombre" },
      { accessorKey: "speciesName", header: "Especie" },
      { accessorKey: "breed", header: "Raza" },
    ],
    []
  );

  const animalActions: Action<AnimalSummaryResponse>[] = [
    {
      label: "Activar",
      type: "direct",
      icon: <RotateCw className="w-4 h-4" />,
      onClick: (row) => openPanel(AnimalPanel.Enable, row),
    },
    {
      label: "Eliminar",
      type: "direct",
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(AnimalPanel.Delete, row),
    },
  ];

  useEffect(() => {
    fetchAnimals(0, 10, searchQuery);
  }, [searchQuery]);

  const fetchAnimals = async (page: number = 0, pageSize: number = 10, searchQuery?: string) => {
    setLoading(true);
    try {
      const response = await AnimalService.getAnimals({
        page,
        size: pageSize,
        active: false,
        query: searchQuery,
      });
      setInactiveAnimals(response.content);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar animales";
      toast.error(message);
      console.error("Error fetching animals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAnimal = async () => {
    if (selectedAnimal) {
      setLoading(true);
      try {
        const result = await AnimalService.restoreAnimal(selectedAnimal.id);
        setInactiveAnimals((prev) => prev.filter((a) => a.id !== selectedAnimal.id));
        addAnimal(result);
        toast.success(`El animal ${result.name} ha sido activado`);
        setActivePanel(null);
      } catch (error: unknown) {
        const message = getAaxiosErrorMessage(error) || "Error al activar el animal";
        toast.error(message);
        console.error("Error enabling animal:", error);
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
        setInactiveAnimals((prev) => prev.filter((a) => a.id !== selectedAnimal.id));
        toast.success("Animal eliminado correctamente");
        setActivePanel(null);
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
        data={inactiveAnimals}
        columns={animalColumns}
        actions={animalActions}
        fetchData={fetchAnimals}
        onSearch={setSearchQuery}
        totalPages={totalPages}
        loading={loading}
      />

      <ConfirmationDialog
        open={activePanel === AnimalPanel.Enable}
        onClose={() => setActivePanel(null)}
        title="¿Estás seguro de activar este animal?"
        description={
          <>
            Al activar <strong>{selectedAnimal?.name}</strong>, estará disponible nuevamente en
            servicios o registros.
          </>
        }
        showTooltip={false}
        onConfirm={handleEnableAnimal}
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
        tooltipMessage="Esta acción no afectará registros históricos."
        onConfirm={handleDeleteAnimal}
        confirmText="Eliminar"
        confirmVariant="destructive"
      />
    </div>
  );
}
