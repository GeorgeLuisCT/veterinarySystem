"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/user-context";
import { SETTINGS_GROUPS, canSee } from "@/config/settings";
import { cn } from "@/lib/utils";

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Configuración: todo lo que se puede ajustar en la empresa, ordenado por tema. Solo se muestra lo que el usuario puede abrir. */
export default function SettingsPage() {
  const { userInfo } = useUser();
  const roles: string[] = userInfo?.roles ?? [];
  const [term, setTerm] = useState("");
  const t = normalize(term.trim());

  const visible = SETTINGS_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (s) => canSee(s, roles) && (!t || normalize(`${s.label} ${s.description} ${s.keywords ?? ""} ${g.title}`).includes(t))
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Configuración"
          description="Todo lo que se puede ajustar en tu veterinaria, ordenado por tema."
          actions={
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar una configuración..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="pl-8"
                aria-label="Buscar una configuración"
              />
            </div>
          }
        />

        {visible.length === 0 && (
          <div className="rounded-xl border py-14 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">
              {t ? "Ninguna configuración coincide con tu búsqueda" : "No tienes configuraciones disponibles"}
            </p>
            {t && (
              <button type="button" onClick={() => setTerm("")} className="mt-2 cursor-pointer text-sm text-primary hover:underline">
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

        <div className="space-y-8">
          {visible.map((group) => {
            const GroupIcon = group.icon;
            const id = `grp-${normalize(group.title).replace(/\s+/g, "-")}`;
            return (
              <section key={group.title} aria-labelledby={id}>
                <div className="mb-3 flex items-center gap-2">
                  <GroupIcon className="h-4 w-4 text-muted-foreground" />
                  <h2 id={id} className="text-sm font-semibold text-foreground">
                    {group.title}
                  </h2>
                  <span className="text-xs text-muted-foreground">· {group.subtitle}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((s) => {
                    const Icon = s.icon;
                    const body = (
                      <>
                        <div className={cn("shrink-0 rounded-lg p-2.5", group.tile)}>
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                            {s.label}
                            {s.soon && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                                Próximamente
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                        </div>
                      </>
                    );
                    if (s.soon) {
                      return (
                        <div
                          key={s.href}
                          aria-disabled="true"
                          className="flex cursor-not-allowed items-start gap-3 rounded-xl border bg-card p-4 opacity-60"
                        >
                          {body}
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={s.href}
                        href={s.href}
                        className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                      >
                        {body}
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </PageContainer>
    </DashboardLayoutSection>
  );
}
