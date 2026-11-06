"use client";

import FieldworkFarmsMain from "@/app/dashboard/fieldwork/components/fieldwork-farms-main";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function FieldworkFarmsPage() {
  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Zonas y granjas"
          description="Administra zonas geográficas y unidades de producción."
        />
        <FieldworkFarmsMain />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
