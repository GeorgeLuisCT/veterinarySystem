"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

import { PREF, parsePref, type PrefKey } from "@/config/preferences";
import PreferencesService from "@/services/preferences-service";
import { useUser } from "@/context/user-context";

interface PreferencesContextType {
  values: Record<string, string>;
  /** Vuelve a pedir las preferencias resueltas (tras guardar en la pantalla de Preferencias). */
  reload: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType>({ values: {}, reload: async () => {} });

/**
 * Preferencias ya resueltas (persona + sucursal + empresa) de quien usa la app. Se cargan al entrar, al cambiar de sucursal
 * y al volver a la pestaña. Mientras llegan, cada preferencia vale su predeterminado (el comportamiento de siempre).
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id || undefined;
  const [values, setValues] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    try {
      setValues(await PreferencesService.effective(branchId));
    } catch {
      // Sin preferencias la app sigue con los valores por defecto.
    }
  }, [branchId]);

  useEffect(() => {
    void reload();
    const onVisible = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  // Apariencia: tamaño de letra y densidad de tablas (ver styles/globals.css).
  const fontSize = parsePref(PREF.fontSize, values[PREF.fontSize.key]);
  const density = parsePref(PREF.density, values[PREF.density.key]);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontSize = fontSize;
    root.dataset.density = density;
    return () => {
      delete root.dataset.fontSize;
      delete root.dataset.density;
    };
  }, [fontSize, density]);

  useIdleLogout(parsePref(PREF.idleTimeout, values[PREF.idleTimeout.key]));

  const value = useMemo(() => ({ values, reload }), [values, reload]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

/** Valor de una preferencia, ya del tipo correcto. Mientras llegan del servidor vale el predeterminado. */
export function usePref<T>(p: PrefKey<T>): T {
  const { values } = useContext(PreferencesContext);
  return parsePref(p, values[p.key]);
}

export function usePreferences() {
  return useContext(PreferencesContext);
}

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

/** Cierra la sesión si no hay actividad durante `minutes` (0 = nunca). */
function useIdleLogout(minutes: number) {
  const router = useRouter();

  useEffect(() => {
    if (!minutes || minutes <= 0) return;
    let timer = 0;
    const logout = () => {
      Cookies.remove("token");
      toast.info("Tu sesión se cerró por inactividad.");
      router.push("/login");
    };
    const restart = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(logout, minutes * 60_000);
    };
    restart();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, restart, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, restart));
    };
  }, [minutes, router]);
}
