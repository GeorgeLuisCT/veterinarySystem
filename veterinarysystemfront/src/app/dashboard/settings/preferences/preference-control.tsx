"use client";

import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { PrefItem } from "@/config/preferences";

const split = (v: string) => (v === "" ? [] : v.split(","));

/**
 * Control de UNA preferencia, elegido por su tipo. Gracias a esto, agregar una preferencia nueva no requiere tocar el frontend:
 * la pantalla recibe la definición del servidor y dibuja el control que corresponde. `onChange` recibe el valor como texto.
 */
export function PreferenceControl({
  item,
  disabled,
  onChange,
}: {
  item: PrefItem;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const id = `pref-${item.key}`;

  switch (item.type) {
    case "Bool":
      return (
        <Switch
          id={id}
          aria-label={item.label}
          checked={item.value === "true"}
          disabled={disabled}
          onCheckedChange={(v) => onChange(v ? "true" : "false")}
        />
      );

    case "Int":
      return <IntControl id={id} item={item} disabled={disabled} onChange={onChange} />;

    case "Choice":
      return (
        <Select value={item.value} disabled={disabled} onValueChange={onChange}>
          <SelectTrigger id={id} aria-label={item.label} className="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {item.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default: {
      const selected = split(item.value);
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {item.options.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(o.value)}
                disabled={disabled}
                onCheckedChange={(on) =>
                  onChange(
                    item.options
                      .map((x) => x.value)
                      .filter((v) => (v === o.value ? !!on : selected.includes(v)))
                      .join(",")
                  )
                }
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
  }
}

function IntControl({
  id,
  item,
  disabled,
  onChange,
}: {
  id: string;
  item: PrefItem;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [text, setText] = useState(item.value);
  useEffect(() => setText(item.value), [item.value]);
  const n = Number(text);
  const invalid =
    text.trim() === "" ||
    !Number.isInteger(n) ||
    (item.min !== null && n < item.min) ||
    (item.max !== null && n > item.max);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        id={id}
        type="number"
        aria-label={item.label}
        className="w-28"
        value={text}
        disabled={disabled}
        aria-invalid={invalid}
        min={item.min ?? undefined}
        max={item.max ?? undefined}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        onBlur={() => {
          if (invalid) setText(item.value);
          else if (String(n) !== item.value) onChange(String(n));
        }}
      />
      {item.unit && <span className="text-sm text-muted-foreground">{item.unit}</span>}
      {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
    </div>
  );
}
