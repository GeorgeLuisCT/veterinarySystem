"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { ZonesTable } from "@/app/dashboard/fieldwork/components/fieldwork-farms-main";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";
import { SETTINGS_URL } from "@/config/settings";

export default function GeoZonesPage() {
  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          backHref={SETTINGS_URL}
          backLabel="Configuración"
          title="Zonas geográficas"
          description="Regiones, provincias, distritos y sectores donde están las granjas que atiendes."
        />
        <ZonesTable />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
