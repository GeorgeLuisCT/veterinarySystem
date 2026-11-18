"use client";

import * as React from "react";
import { ArrowLeft, Loader2, PawPrint } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { FloatingLabelDateInput } from "@/components/floating-label-date-input";
import { getAaxiosErrorMessage } from "@/helpers/error";
import CustomerService from "@/app/dashboard/crm/customers/service/customer-service";
import AnimalService from "../service/animal-service";
import { AnimalSpecies, AnimalSpeciesLabels, AnimalSpeciesOptions } from "../enums/animal-species";

export type QuickCreatedAnimal = {
  id: number;
  name: string;
  ownerName: string;
  species: AnimalSpecies;
};

type Props = {
  idPrefix: string;
  initialName?: string;
  onCreated: (animal: QuickCreatedAnimal) => void;
  onBack: () => void;
};

/**
 * Registro rápido de mascota como vista dentro de otro modal (reemplaza su contenido, sin abrir otro modal).
 * No usa <form> porque convive con el formulario del modal: los botones son type="button" y Enter guarda aquí.
 */
export function QuickAnimalCreate({ idPrefix, initialName = "", onCreated, onBack }: Props) {
  const [name, setName] = React.useState(initialName);
  const [species, setSpecies] = React.useState<string>("");
  const [ownerId, setOwnerId] = React.useState<string>("");
  const [birthDate, setBirthDate] = React.useState("");
  const [breed, setBreed] = React.useState("");
  const [ownerOptions, setOwnerOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const searchOwners = React.useCallback(async (query: string) => {
    if (!query.trim()) return;
    try {
      const customers = await CustomerService.searchCustomers(query.trim());
      setOwnerOptions(customers.map((c) => ({ value: String(c.id), label: `${c.name} • ${c.documentNumber}` })));
    } catch {
      setOwnerOptions([]);
    }
  }, []);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) return setError("Escribe el nombre de la mascota.");
    if (!species) return setError("Selecciona la especie.");
    if (!ownerId) return setError("Selecciona el dueño (búscalo por nombre o documento).");
    if (!birthDate) return setError("Indica la fecha de nacimiento (aproximada si no la sabes).");

    setSaving(true);
    try {
      const created = await AnimalService.createAnimal({
        name: name.trim(),
        species: species as AnimalSpecies,
        ownerId: Number(ownerId),
        birthDate: birthDate.slice(0, 10),
        breed: breed.trim() || undefined,
      });
      const ownerLabel = ownerOptions.find((o) => o.value === ownerId)?.label.split(" • ")[0] ?? "";
      onCreated({
        id: created.id,
        name: created.name,
        ownerName: created.ownerName ?? ownerLabel,
        species: species as AnimalSpecies,
      });
    } catch (err) {
      setError(getAaxiosErrorMessage(err) || "No se pudo registrar la mascota.");
    } finally {
      setSaving(false);
    }
  };

  // Enter en un campo guarda la mascota en lugar de enviar el formulario del modal.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      void handleSave();
    }
  };

  return (
    <div className="space-y-5" onKeyDown={handleKeyDown} role="group" aria-label="Registrar nueva mascota">
      <div className="flex items-center gap-3 border-b pb-3">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} disabled={saving}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver
        </Button>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <PawPrint className="h-4 w-4 text-primary" /> Al guardar volverás con la mascota ya seleccionada.
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FloatingLabelInput id={`${idPrefix}-name`} label="Nombre" value={name} onChange={setName} disabled={saving} />
        <FloatingLabelSelect
          id={`${idPrefix}-species`}
          label="Especie"
          value={species}
          onValueChange={setSpecies}
          options={AnimalSpeciesOptions.map((o) => ({ value: o.value, label: o.label }))}
          disabled={saving}
        />
        <FloatingLabelSelect
          id={`${idPrefix}-owner`}
          label="Dueño"
          value={ownerId}
          onValueChange={setOwnerId}
          options={ownerOptions}
          onSearch={searchOwners}
          emptyMessage="Escribe el nombre o documento del cliente."
          disabled={saving}
        />
        <FloatingLabelDateInput
          id={`${idPrefix}-birthDate`}
          label="Fecha de nacimiento"
          value={birthDate}
          onChange={setBirthDate}
          mode="date"
          disabled={saving}
        />
        <FloatingLabelInput
          id={`${idPrefix}-breed`}
          label="Raza (opcional)"
          value={breed}
          onChange={setBreed}
          disabled={saving}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
          Volver sin guardar
        </Button>
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar y seleccionar
        </Button>
      </div>
    </div>
  );
}

export function quickAnimalLabel(animal: QuickCreatedAnimal) {
  return `${animal.name} • ${animal.ownerName || "Sin propietario"} • ${AnimalSpeciesLabels[animal.species] ?? ""}`.trim();
}
