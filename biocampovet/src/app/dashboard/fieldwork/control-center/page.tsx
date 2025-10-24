"use client";

import * as React from "react";
import TeamStatusGrid from "../components/control-center/team-status-grid";
import PendingTasksCard from "../components/control-center/pending-tasks-card";
import PlannedVisitsTable from "../components/control-center/planned-visits-table";
import RecentReportsCard from "../components/control-center/recent-reports-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

export default function FieldworkControlCenterPage() {
  return (
      <div className="flex flex-col gap-4 h-full p-4 pt-0">
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
        <div className="w-full flex gap-4 h-full">
          <div className="w-[70%] flex flex-col gap-4 h-full">
            <div className="h-[45%] max-h-[45%]">
              <PendingTasksCard />
            </div>
            <div className="h-[53%] max-h-[53%]">
              <PlannedVisitsTable />
            </div>
          </div>

          <div className="w-[30%] flex flex-col gap-4 h-full">
            <div className="h-[55%] max-h-[55%]">
              <RecentReportsCard />
            </div>
            <div className="h-[45%] max-h-[45%]">
              <TeamStatusGrid />
            </div>
          </div>
        </div>
      </div>
  );
}
