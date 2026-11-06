"use client";

import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainInventoryMovements from "../../_components/main-inventory-movements";
import { PageContainer } from "@/components/page/page-container";

export default function InventoryMovementsPage() {
  return (
    <DashboardLayoutSection>
      <PageContainer>
        <MainInventoryMovements />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
