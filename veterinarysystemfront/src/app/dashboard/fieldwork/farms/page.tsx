"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import FieldworkFarmsMain from "@/app/dashboard/fieldwork/components/fieldwork-farms-main";
import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import { PageContainer } from "@/components/page/page-container";
import { PageHeader } from "@/components/page/page-header";

export default function FieldworkFarmsPage() {
  return (
    <DashboardLayoutSection>
      <PageContainer>
        <PageHeader
          title="Granjas"
          description="Administra las unidades de producción que atiendes."
          actions={
            <Button variant="secondary" asChild>
              <Link href="/dashboard/settings/geo-zones">
                <MapPinned className="mr-2 h-4 w-4" />
                Zonas geográficas
              </Link>
            </Button>
          }
        />
        <FieldworkFarmsMain />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
