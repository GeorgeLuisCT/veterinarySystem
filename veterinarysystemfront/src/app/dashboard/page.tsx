"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import DashboardLayoutSection from "./dashboard-layout-section";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";
import { useUser } from "@/context/user-context";
import { navigationConfig } from "@/config/navigation";

type NavItem = { title: string; url: string; rolesAllowed: string[] };
type NavSection = {
  title: string;
  url?: string;
  icon?: React.ComponentType<{ className?: string }>;
  rolesAllowed: string[];
  items?: NavItem[];
};

/** Inicio: accesos rápidos a lo que el usuario puede hacer según sus roles. */
export default function DashboardPage() {
  const { userInfo } = useUser();
  const roles: string[] = userInfo?.roles ?? [];
  const allowed = (r: string[]) => r.some((role) => roles.includes(role));

  const sections = ([...navigationConfig.navMain, ...navigationConfig.projects] as NavSection[])
    .filter((s) => allowed(s.rolesAllowed))
    .map((s) => ({
      ...s,
      // Módulos sin sub-ítems (p. ej. Reportes) se muestran como un único enlace
      items:
        (s.items ?? []).length === 0 && s.url
          ? [{ title: `Ir a ${s.title}`, url: s.url, rolesAllowed: s.rolesAllowed }]
          : (s.items ?? []).filter((i) => allowed(i.rolesAllowed)),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title={`Hola, ${userInfo?.firstName ?? "bienvenido"}`}
          description={
            userInfo?.selectedBranch
              ? `Sucursal ${userInfo.selectedBranch.name}. ¿Qué quieres hacer hoy?`
              : "¿Qué quieres hacer hoy?"
          }
        />

        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tu usuario aún no tiene módulos asignados. Contacta al administrador.
          </p>
        ) : (
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <section key={section.title}>
                  <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                    {Icon && <Icon className="size-4 text-muted-foreground" />}
                    {section.title}
                  </h2>
                  <ul className="divide-y border-t">
                    {section.items.map((item) => (
                      <li key={item.url}>
                        <Link
                          href={item.url}
                          className="group flex items-center justify-between py-2.5 text-sm text-foreground hover:text-primary"
                        >
                          {item.title}
                          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </PageContainer>
    </DashboardLayoutSection>
  );
}
