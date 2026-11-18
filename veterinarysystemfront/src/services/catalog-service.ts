import api from "@/services/api";
import type { CatalogItem } from "@/lib/catalogs";

export interface CatalogSummary {
  key: string;
  title: string;
  description: string;
  group: string;
  usesAbbreviation: boolean;
  abbreviationLabel: string | null;
  usesPlural: boolean;
  activeItems: number;
  totalItems: number;
}

export interface CatalogItemRequest {
  label: string;
  pluralLabel?: string | null;
  abbreviation?: string | null;
  active?: boolean;
}

export const CatalogService = {
  /** Todos los valores de todos los catálogos (activos e inactivos), para traducir cualquier código guardado. */
  allItems: async (): Promise<Record<string, CatalogItem[]>> => (await api.get("/catalogs/items")).data,
  list: async (): Promise<CatalogSummary[]> => (await api.get("/catalogs")).data,
  items: async (key: string): Promise<CatalogItem[]> =>
    (await api.get(`/catalogs/${key}`, { params: { includeInactive: true } })).data,
  create: async (key: string, body: CatalogItemRequest): Promise<CatalogItem> => (await api.post(`/catalogs/${key}`, body)).data,
  update: async (key: string, id: number, body: CatalogItemRequest): Promise<CatalogItem> =>
    (await api.put(`/catalogs/${key}/${id}`, body)).data,
  remove: async (key: string, id: number): Promise<void> => {
    await api.delete(`/catalogs/${key}/${id}`);
  },
  reorder: async (key: string, ids: number[]): Promise<CatalogItem[]> => (await api.put(`/catalogs/${key}/order`, { ids })).data,
};

export default CatalogService;
