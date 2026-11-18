"use client";

import * as React from "react";

import { FloatingLabelSelect } from "@/components/floating-label-select";

export type AnimalPickerOption = { id: number; label: string };

type Props = {
  id: string;
  value?: number | null;
  onChange: (animalId: number) => void;
  options: AnimalPickerOption[];
  onSearch?: (query: string) => void;
  /** Muestra "+ Registrar nueva mascota" al final de la lista; recibe lo que se estaba buscando. */
  onRequestCreate?: (query: string) => void;
  disabled?: boolean;
  label?: string;
  emptyMessage?: string;
};

/** Selector de mascota con acceso al registro rápido (el contenedor decide cómo mostrar el formulario). */
export function AnimalPickerField({
  id,
  value,
  onChange,
  options,
  onSearch,
  onRequestCreate,
  disabled,
  label = "Mascota",
  emptyMessage = "No se encontraron mascotas.",
}: Props) {
  return (
    <FloatingLabelSelect
      id={id}
      label={label}
      value={value ? String(value) : ""}
      onValueChange={(v) => onChange(Number(v))}
      options={options.map((o) => ({ value: String(o.id), label: o.label }))}
      onSearch={onSearch}
      disabled={disabled}
      emptyMessage={emptyMessage}
      createOption={
        onRequestCreate
          ? {
              onCreate: onRequestCreate,
              label: (query) => (query ? `Registrar "${query}" como nueva mascota` : "Registrar nueva mascota"),
            }
          : undefined
      }
    />
  );
}
