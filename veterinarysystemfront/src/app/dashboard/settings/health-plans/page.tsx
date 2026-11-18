"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { HealthPlansMain } from "@/app/dashboard/clinical/components/health-plans-main";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";
import { SETTINGS_URL } from "@/config/settings";

export default function HealthPlansPage() {
  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          backHref={SETTINGS_URL}
          backLabel="Configuración"
          title="Planes de salud"
          description="Paquetes de servicios con precio que ofreces a tus clientes."
        />
        <HealthPlansMain />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
