"use client";

import * as React from "react";

import { useToast } from "@/hooks/use-toast";
import { QuickAnimalCreate, quickAnimalLabel, type QuickCreatedAnimal } from "./quick-animal-create";

export const QUICK_ANIMAL_TITLE = "Registrar nueva mascota";
export const QUICK_ANIMAL_DESCRIPTION = "Completa los datos básicos; podrás ampliar la ficha después desde Pacientes.";

export type { QuickCreatedAnimal };
export { quickAnimalLabel };

/**
 * Estado de la vista "Nueva mascota" dentro de un modal: reemplaza su contenido (sin abrir otro modal)
 * y al volver el formulario principal sigue intacto, porque solo se oculta, no se desmonta.
 *
 * Uso en un modal:
 *   const quickAnimal = useQuickAnimalView();
 *   <DialogContent onEscapeKeyDown={quickAnimal.handleEscapeKeyDown}>
 *     <DialogTitle>{quickAnimal.active ? QUICK_ANIMAL_TITLE : "Título normal"}</DialogTitle>
 *     <QuickAnimalView view={quickAnimal} idPrefix="..." onCreated={(a) => { agregar opción y seleccionarla }} />
 *     <div className={quickAnimal.mainClassName}> ...contenido normal... </div>
 *   el selector abre la vista con onRequestCreate={quickAnimal.open}; al cerrar el modal llamar quickAnimal.reset().
 */
export function useQuickAnimalView() {
  const [name, setName] = React.useState<string | null>(null);
  const [returned, setReturned] = React.useState(false);
  const active = name !== null;

  const open = React.useCallback((query: string) => {
    setReturned(false);
    setName(query);
  }, []);

  const close = React.useCallback(() => {
    setName(null);
    setReturned(true);
  }, []);

  const reset = React.useCallback(() => {
    setName(null);
    setReturned(false);
  }, []);

  /** Escape vuelve al formulario principal en lugar de cerrar el modal. */
  const handleEscapeKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (name === null) return;
      event.preventDefault();
      close();
    },
    [name, close]
  );

  const mainClassName = active
    ? "hidden"
    : returned
      ? "animate-in fade-in-0 slide-in-from-left-12 duration-300"
      : undefined;

  return { active, name, open, close, reset, handleEscapeKeyDown, mainClassName };
}

export type QuickAnimalViewState = ReturnType<typeof useQuickAnimalView>;

type Props = {
  view: QuickAnimalViewState;
  idPrefix: string;
  /** Recibe la mascota creada: el modal la agrega a sus opciones y la deja seleccionada. */
  onCreated: (animal: QuickCreatedAnimal) => void;
};

/** Vista "Nueva mascota" que entra deslizándose desde la derecha. */
export function QuickAnimalView({ view, idPrefix, onCreated }: Props) {
  const { toast } = useToast();
  if (!view.active) return null;

  return (
    <div className="animate-in fade-in-0 slide-in-from-right-12 duration-300">
      <QuickAnimalCreate
        idPrefix={idPrefix}
        initialName={view.name ?? ""}
        onBack={view.close}
        onCreated={(animal) => {
          onCreated(animal);
          toast({ title: "Mascota registrada", description: `${animal.name} quedó seleccionada.` });
          view.close();
        }}
      />
    </div>
  );
}
