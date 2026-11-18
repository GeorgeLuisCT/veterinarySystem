import api from "@/services/api";
import { DEFAULT_HOME, PREF, parsePref, type PrefItem, type PrefLevel, type PrefSection } from "@/config/preferences";

function base(level: PrefLevel, branchId?: number): string {
  if (level === "me") return "/preferences/me";
  if (level === "company") return "/preferences/company";
  return `/branches/${branchId}/preferences`;
}

export const PreferencesService = {
  /** Todo ya resuelto (persona + sucursal + empresa) para que la app se adapte. */
  effective: async (branchId?: number): Promise<Record<string, string>> => {
    const { data } = await api.get<Record<string, string>>("/preferences/effective", {
      params: branchId ? { branchId } : undefined,
    });
    return data;
  },
  list: async (level: PrefLevel, branchId?: number): Promise<PrefSection> => {
    const { data } = await api.get<PrefSection>(`${base(level, branchId)}/`);
    return data;
  },
  set: async (level: PrefLevel, key: string, value: string, branchId?: number): Promise<PrefItem> => {
    const { data } = await api.put<PrefItem>(`${base(level, branchId)}/${key}`, { value });
    return data;
  },
  reset: async (level: PrefLevel, key: string, branchId?: number): Promise<void> => {
    await api.delete(`${base(level, branchId)}/${key}`);
  },
};

/** Pantalla a la que se entra tras iniciar sesión (preferencia «Pantalla de inicio»); si falla, la de siempre. */
export async function resolveHomePage(branchId?: number): Promise<string> {
  try {
    const home = parsePref(PREF.home, (await PreferencesService.effective(branchId))[PREF.home.key]);
    return home && home !== "auto" && home.startsWith("/dashboard") ? home : DEFAULT_HOME;
  } catch {
    return DEFAULT_HOME;
  }
}

export default PreferencesService;
