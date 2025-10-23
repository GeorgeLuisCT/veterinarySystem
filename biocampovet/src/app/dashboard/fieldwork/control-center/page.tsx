"use client";

import * as React from "react";
import KpiGrid from "../components/control-center/kpi-grid";
import TeamStatusGrid from "../components/control-center/team-status-grid";
import PendingTasksCard from "../components/control-center/pending-tasks-card";
import PlannedVisitsTable from "../components/control-center/planned-visits-table";
import RecentReportsCard from "../components/control-center/recent-reports-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

export default function FieldworkControlCenterPage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-background to-muted/30 p-4 pt-0">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Centro de Control de Campo</h1>
            <p className="text-sm text-muted-foreground">Planifica tareas, asigna equipos y da seguimiento a las visitas.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="rounded-2xl shadow-sm">
              <Link href="/dashboard/fieldwork/control-center/vehicles">
                <Car className="mr-2 h-4 w-4" />
                Gestionar vehículos
              </Link>
            </Button>
          </div>
        </header>

        <KpiGrid />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PendingTasksCard />
          </div>
          <div className="lg:col-span-1">
            <TeamStatusGrid />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PlannedVisitsTable />
          </div>
          <div className="lg:col-span-1">
            <RecentReportsCard />
          </div>
        </div>
      </div>
    </div>
  );
}
