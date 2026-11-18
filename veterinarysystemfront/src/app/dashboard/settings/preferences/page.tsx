"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, MapPin, UserRound } from "lucide-react";
import { toast } from "sonner";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";
import { SegmentedControl } from "@/components/page/segmented-control";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/context/user-context";
import { usePreferences } from "@/context/preferences-context";
import { SETTINGS_URL } from "@/config/settings";
import type { PrefItem, PrefLevel, PrefSection } from "@/config/preferences";
import PreferencesService from "@/services/preferences-service";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { PreferenceControl } from "./preference-control";

/** Preferencias en tres niveles: las mías, las de la sucursal (ADMIN/MANAGER) y las de la empresa (ADMIN). */
export default function PreferencesPage() {
  const { userInfo } = useUser();
  const { reload } = usePreferences();
  const roles: string[] = userInfo?.roles ?? [];
  const branchId = userInfo?.selectedBranch?.id || undefined;
  const branchName = userInfo?.selectedBranch?.name;
  const canBranch = roles.includes("ROLE_ADMIN") || roles.includes("ROLE_MANAGER");
  const canCompany = roles.includes("ROLE_ADMIN");

  const tabs = useMemo(
    () => [
      { value: "me" as const, label: "Mías", icon: UserRound },
      ...(canBranch ? [{ value: "branch" as const, label: "De la sucursal", icon: MapPin }] : []),
      ...(canCompany ? [{ value: "company" as const, label: "De la empresa", icon: Building2 }] : []),
    ],
    [canBranch, canCompany]
  );

  const [level, setLevel] = useState<PrefLevel>("me");
  const [section, setSection] = useState<PrefSection | null>(null);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setSection(await PreferencesService.list(level, level === "branch" ? branchId : undefined));
    } catch (e) {
      setSection(null);
      setError(getAaxiosErrorMessage(e) || "No se pudieron cargar las preferencias.");
    }
  }, [level, branchId]);

  useEffect(() => {
    setSection(null);
    void load();
  }, [load]);

  async function save(item: PrefItem, value: string) {
    setBusyKey(item.key);
    try {
      await PreferencesService.set(level, item.key, value, level === "branch" ? branchId : undefined);
      toast.success("Preferencia guardada");
      await load();
      await reload(); // lo guardado se ve ya en el resto de la app
    } catch (e) {
      toast.error(getAaxiosErrorMessage(e) || "No se pudo guardar");
    } finally {
      setBusyKey(null);
    }
  }

  async function reset(item: PrefItem) {
    setBusyKey(item.key);
    try {
      await PreferencesService.reset(level, item.key, level === "branch" ? branchId : undefined);
      toast.success("Restablecida");
      await load();
      await reload();
    } catch (e) {
      toast.error(getAaxiosErrorMessage(e) || "No se pudo restablecer");
    } finally {
      setBusyKey(null);
    }
  }

  const intro: Record<PrefLevel, string> = {
    me: "Solo te afectan a ti y te acompañan en cualquier computador.",
    branch: `Valen para todo el personal de ${branchName ?? "la sucursal"}. Lo que no cambies aquí lo decide la empresa.`,
    company: "Valen para todas las sucursales que no tengan su propio valor, y para la seguridad de toda la empresa.",
  };

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Preferencias"
          description="Ajusta cómo se ve y cómo se comporta la aplicación. Cada cambio se guarda al instante."
          backHref={SETTINGS_URL}
          backLabel="Configuración"
          actions={
            tabs.length > 1 ? (
              <SegmentedControl<PrefLevel> aria-label="Nivel de las preferencias" value={level} onChange={setLevel} options={tabs} />
            ) : undefined
          }
        />

        <p className="text-sm text-muted-foreground">{intro[level]}</p>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {!section && !error && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        )}

        <div className="space-y-6">
          {section?.groups.map((g) => (
            <Card key={g.key}>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{g.label}</h2>
                  <p className="text-sm text-muted-foreground">{g.description}</p>
                </div>
                <div className="divide-y">
                  {g.items.map((item) => (
                    <div
                      key={item.key}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between"
                    >
                      <div className="min-w-0 md:max-w-md">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                        {level === "branch" && item.source === "company" && (
                          <p className="mt-1 text-xs text-primary">Heredado de la empresa</p>
                        )}
                      </div>
                      <div className="flex items-start gap-3">
                        <PreferenceControl
                          item={item}
                          disabled={busyKey === item.key || (level === "branch" && !branchId)}
                          onChange={(v) => void save(item, v)}
                        />
                        {item.source === "own" && (
                          <Button type="button" variant="outline" size="sm" disabled={busyKey === item.key} onClick={() => void reset(item)}>
                            Restablecer
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </DashboardLayoutSection>
  );
}
