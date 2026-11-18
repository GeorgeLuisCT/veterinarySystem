/**
 * Preferencias que la app LEE. `key` es la clave del backend (Modules/Preferences/Preferences.cs) y `def` su valor por defecto:
 * solo se usa mientras llegan del servidor (el tipo de `def` decide cómo se interpreta: boolean, number, string[] o string).
 * Para agregar una: declararla en Preferences.cs, añadir la línea aquí y leerla con `usePref(PREF.xxx)`. Ver docs/preferencias.md.
 */
export interface PrefKey<T> {
  readonly key: string;
  readonly def: T;
}
const k = <T,>(key: string, def: T): PrefKey<T> => ({ key, def });

export const PREF = {
  fontSize: k("ui.fontSize", "normal"),
  density: k("ui.density", "comfortable"),
  home: k("start.home", "auto"),
  appointmentDuration: k("schedule.defaultDurationMinutes", 0),
  hiddenModules: k<string[]>("interface.hiddenModules", []),
  idleTimeout: k("security.idleTimeoutMinutes", 0),
} as const;

/** Convierte el texto del servidor al tipo del valor por defecto. */
export function parsePref<T>(p: PrefKey<T>, raw: string | undefined): T {
  if (raw === undefined) return p.def;
  const d: unknown = p.def;
  if (typeof d === "boolean") return (raw === "true") as T;
  if (typeof d === "number") {
    const n = parseInt(raw, 10);
    return (Number.isNaN(n) ? d : n) as T;
  }
  if (Array.isArray(d)) return (raw === "" ? [] : raw.split(",")) as T;
  return raw as T;
}

/** Pantalla de inicio cuando la preferencia vale «auto» (el comportamiento de siempre). */
export const DEFAULT_HOME = "/dashboard/pos/sales/new";

// ---- Tipos de la pantalla de Preferencias ----
export type PrefType = "Bool" | "Int" | "Choice" | "MultiChoice";
export type PrefSource = "own" | "company" | "default";
/** A quién pertenece el valor que se edita: a la persona, a una sucursal o a toda la empresa. */
export type PrefLevel = "me" | "branch" | "company";

export interface PrefOption {
  value: string;
  label: string;
}

export interface PrefItem {
  key: string;
  label: string;
  description: string;
  type: PrefType;
  default: string;
  value: string;
  source: PrefSource;
  min: number | null;
  max: number | null;
  unit: string | null;
  hint: string | null;
  options: PrefOption[];
}

export interface PrefGroup {
  key: string;
  label: string;
  description: string;
  items: PrefItem[];
}

export interface PrefSection {
  groups: PrefGroup[];
}
