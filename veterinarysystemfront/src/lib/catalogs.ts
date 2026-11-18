import { useSyncExternalStore } from "react";

/**
 * CATÁLOGOS EDITABLES (Configuración → Catálogos). Listas de negocio que antes eran enums fijos (especies, vías de administración…)
 * y ahora vienen de la base de cada empresa. Lo que la app ya usaba sigue funcionando igual:
 *   - `AnimalSpecies.CANINE` vale "CANINE" y `Object.values(AnimalSpecies)` devuelve los códigos ACTIVOS del catálogo;
 *   - `AnimalSpeciesLabels[code]` devuelve el texto configurado (también de valores desactivados, para datos antiguos);
 *   - `AnimalSpeciesOptions` es la lista de opciones activas, en el orden configurado.
 * Mientras el catálogo no ha llegado del servidor (o fuera del panel) se usan los valores por defecto de cada archivo.
 */
export interface CatalogItem {
  id: number;
  code: string;
  label: string;
  pluralLabel: string | null;
  abbreviation: string | null;
  sortOrder: number;
  active: boolean;
}

export const CatalogKey = {
  AnimalSpecies: "animal_species",
  AdministrationRoute: "administration_route",
  ProductPresentation: "product_presentation",
  SupplierType: "supplier_type",
  MedicalRecordCategory: "medical_record_category",
  CageSize: "cage_size",
  GeoZoneType: "geo_zone_type",
  FieldTaskPriority: "field_task_priority",
  TreasuryAccountType: "treasury_account_type",
  LabUnit: "lab_unit",
} as const;

// ---- Almacén compartido ----
let store: Record<string, CatalogItem[]> | null = null;
let version = 0;
const listeners = new Set<() => void>();

export function setCatalogStore(data: Record<string, CatalogItem[]>) {
  store = data;
  version++;
  listeners.forEach((l) => l());
}

/** Reemplaza un catálogo tras editarlo (Configuración → Catálogos) sin recargar todo. */
export function updateCatalog(key: string, items: CatalogItem[]) {
  store = { ...(store ?? {}), [key]: items };
  version++;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Para re-pintar cuando cambia cualquier catálogo. */
export function useCatalogVersion() {
  return useSyncExternalStore(subscribe, () => version, () => 0);
}

type Seed = Record<string, { label: string; plural?: string; abbreviation?: string }>;
const seeds: Record<string, Seed> = {};

/** Valores del catálogo: los del servidor si ya llegaron; si no, los por defecto declarados en el código. */
export function catalogItems(key: string): CatalogItem[] {
  const fromServer = store?.[key];
  if (fromServer && fromServer.length) return fromServer;
  return Object.entries(seeds[key] ?? {}).map(([code, s], i) => ({
    id: -(i + 1),
    code,
    label: s.label,
    pluralLabel: s.plural ?? null,
    abbreviation: s.abbreviation ?? null,
    sortOrder: (i + 1) * 10,
    active: true,
  }));
}

const activeItems = (key: string) => catalogItems(key).filter((i) => i.active);
const findItem = (key: string, code: string) => catalogItems(key).find((i) => i.code === code);

export function catalogLabel(key: string, code: string | null | undefined): string {
  if (!code) return "";
  return findItem(key, code)?.label ?? seeds[key]?.[code]?.label ?? code;
}

export function catalogAbbreviation(key: string, code: string | null | undefined): string {
  if (!code) return "";
  return findItem(key, code)?.abbreviation ?? seeds[key]?.[code]?.abbreviation ?? "";
}

export function catalogPlural(key: string, code: string | null | undefined): string {
  if (!code) return "";
  const item = findItem(key, code);
  return item?.pluralLabel || item?.label || seeds[key]?.[code]?.plural || code;
}

/** Hook reactivo: valores del catálogo (activos por defecto). */
export function useCatalog(key: string, options?: { includeInactive?: boolean }) {
  useCatalogVersion();
  const items = options?.includeInactive ? catalogItems(key) : activeItems(key);
  return {
    items,
    options: items.map((i) => ({ value: i.code, label: i.label })),
    label: (code: string | null | undefined) => catalogLabel(key, code),
  };
}

// ---- Objetos "tipo enum" respaldados por el catálogo ----

/** Proxy de diccionario: claves = códigos activos (para Object.keys/values/entries); lectura = cualquier código. */
function dictionaryProxy<V>(key: string, read: (code: string) => V | undefined): Record<string, V> {
  return new Proxy({} as Record<string, V>, {
    get: (_t, prop) => (typeof prop === "string" ? read(prop) : undefined),
    has: (_t, prop) => typeof prop === "string" && findItem(key, prop) !== undefined,
    ownKeys: () => activeItems(key).map((i) => i.code),
    getOwnPropertyDescriptor: (_t, prop) => {
      if (typeof prop !== "string") return undefined;
      const value = read(prop);
      return value === undefined ? undefined : { value, enumerable: true, configurable: true, writable: false };
    },
  });
}

/** Lista que siempre refleja los valores activos del catálogo (sirve con .map, .find, .length, for…of, spread). */
function listProxy<T>(build: () => T[]): T[] {
  return new Proxy([] as T[], {
    get: (_t, prop) => {
      const current = build();
      const value = Reflect.get(current, prop, current);
      return typeof value === "function" ? value.bind(current) : value;
    },
    has: (_t, prop) => Reflect.has(build(), prop),
    ownKeys: () => Reflect.ownKeys(build()),
    getOwnPropertyDescriptor: (_t, prop) => {
      const d = Reflect.getOwnPropertyDescriptor(build(), prop);
      return d ? { ...d, configurable: true } : undefined;
    },
  });
}

/**
 * Declara un catálogo con sus valores por defecto y devuelve el objeto "tipo enum":
 * `X.CODE` → "CODE"; `Object.values(X)` → códigos activos del catálogo (incluye los agregados por el usuario).
 */
export function catalogEnum<const C extends string>(key: string, defaults: Record<C, { label: string; plural?: string; abbreviation?: string }>) {
  seeds[key] = defaults;
  return dictionaryProxy<string>(key, (code) => (findItem(key, code) || code in defaults ? code : undefined)) as {
    readonly [K in C]: K;
  } & Record<string, string>;
}

/** `XLabels[code]` → texto configurado. */
export const catalogLabels = (key: string) => dictionaryProxy<string>(key, (code) => catalogLabel(key, code));

/** `XAbbreviations[code]` → abreviatura o símbolo configurado. */
export const catalogAbbreviations = (key: string) => dictionaryProxy<string>(key, (code) => catalogAbbreviation(key, code));

/** `XPlural[code]` → plural configurado (o el singular). */
export const catalogPlurals = (key: string) => dictionaryProxy<string>(key, (code) => catalogPlural(key, code));

/** Opciones activas en el orden configurado; `map` permite agregar campos (p. ej. abreviatura). */
export function catalogOptions<T = { value: string; label: string }>(key: string, map?: (item: CatalogItem) => T): T[] {
  return listProxy(() =>
    activeItems(key).map((i) => (map ? map(i) : ({ value: i.code, label: i.label } as unknown as T)))
  );
}

/** Datos visuales por código (ícono, color…): los del código para los valores conocidos y `fallback` para los nuevos. */
export function catalogDetails<D extends { label: string }>(key: string, known: Record<string, D>, fallback: Omit<D, "label">) {
  return dictionaryProxy<D>(key, (code) => {
    if (!findItem(key, code) && !(code in known)) return undefined;
    return { ...(known[code] ?? fallback), label: catalogLabel(key, code) } as D;
  });
}
