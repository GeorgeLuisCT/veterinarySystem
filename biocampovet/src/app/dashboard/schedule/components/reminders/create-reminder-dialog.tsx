"use client";

import { AnimalSpecies, AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";
import { AnimalService } from "@/app/dashboard/crm/patients/service/animal-service";
import type { AnimalQuickSearchResponse } from "@/app/dashboard/crm/patients/types/animal-quick-search-response";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import type { Option as MultiSelectOption } from "@/components/floating-label-multi-select";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ReminderType, ReminderTypeOptions } from "../../enums/reminder-type";
import ReminderService from "../../service/reminder-service";
import { ReminderCreateRequest } from "../../types/reminder-response";

type CreateReminderForm = {
  animalId: string;
  reminderType: ReminderType;
  dueDate: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

function mapAnimalToOption(
  animal: AnimalQuickSearchResponse
): MultiSelectOption<string> {
  const speciesLabel = AnimalSpeciesLabels[animal.species as AnimalSpecies] ?? "";
  const owner = animal.ownerName ? ` • ${animal.ownerName}` : "";
  return {
    value: String(animal.id),
    label: `${animal.name}${owner}${speciesLabel ? ` • ${speciesLabel}` : ""}`,
  };
}

export function CreateReminderDialog({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const [animalOptions, setAnimalOptions] = useState<
    MultiSelectOption<string>[]
  >([]);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateReminderForm>({
    animalId: "",
    reminderType: ReminderType.VACCINATION,
    dueDate: "",
  });

  const resetCreateForm = useCallback(() => {
    setCreateForm({
      animalId: "",
      reminderType: ReminderType.VACCINATION,
      dueDate: "",
    });
    setAnimalOptions([]);
  }, []);

  useEffect(() => {
    if (open) {
      resetCreateForm();
      (async () => {
        try {
          const initial = await AnimalService.searchAnimals(undefined, true);
          setAnimalOptions(initial.map(mapAnimalToOption));
        } catch (err) {
          console.error(err);
        }
      })();
    } else {
      setCreating(false);
    }
  }, [open, resetCreateForm]);

  const handleAnimalSearch = useCallback(
    async (query: string) => {
      try {
        const trimmed = query.trim();
        if (!trimmed) return;
        const results = await AnimalService.searchAnimals(trimmed, true);
        const options = results.map(mapAnimalToOption);
        setAnimalOptions(options);
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "No se pudo buscar la mascota",
          description: "Verifica tu conexión e intenta nuevamente.",
        });
      }
    },
    [toast]
  );

  const handleCreate = async () => {
    if (!createForm.animalId) {
      toast({ variant: "destructive", title: "Selecciona un paciente" });
      return;
    }
    if (!createForm.dueDate) {
      toast({ variant: "destructive", title: "Selecciona la fecha límite" });
      return;
    }

    const payload: ReminderCreateRequest = {
      animalId: Number(createForm.animalId),
      reminderType: createForm.reminderType,
      dueDate: createForm.dueDate,
    };

    try {
      setCreating(true);
      await ReminderService.create(payload);
      toast({
        title: "Recordatorio creado",
        description: "Se agregó correctamente al listado.",
      });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "No se pudo crear el recordatorio",
        description: "Intenta nuevamente más tarde.",
      });
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo recordatorio</DialogTitle>
          <DialogDescription>
            Agenda un recordatorio manual para un paciente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <FloatingLabelSelect
              id="reminder-animal"
              label="Selecciona un paciente"
              value={createForm.animalId}
              onValueChange={(value) =>
                setCreateForm((prev) => ({ ...prev, animalId: value }))
              }
              options={animalOptions}
              onSearch={handleAnimalSearch}
              emptyMessage="Sin resultados. Escribe al menos 2 caracteres."
            />
          </div>
          <div>
            <FloatingLabelSelect
              id="reminder-type"
              label="Tipo de recordatorio"
              value={createForm.reminderType}
              onValueChange={(value) =>
                setCreateForm((prev) => ({
                  ...prev,
                  reminderType: value as ReminderType,
                }))
              }
              options={ReminderTypeOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </div>
          <div>
            <FloatingLabelDateInput
              id="reminder-date"
              label="Fecha prevista"
              value={createForm.dueDate}
              onChange={(value) =>
                setCreateForm((prev) => ({ ...prev, dueDate: value ?? "" }))
              }
              mode="date"
            />
          </div>
          <div>
            <Input
              id="reminder-notes"
              placeholder="Opcional (por ahora sólo uso interno)"
              disabled
              value="Próximamente"
            />
          </div>
        </div>
        <DialogFooter className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}