"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, ClipboardList, MoveRight, User } from "lucide-react";
import type { SurgicalOrderResponse } from "@/app/dashboard/schedule/types/surgical-order-response";
import { SurgicalOrderStatus } from "@/app/dashboard/schedule/enums/surgical-order-status";

export default function SurgicalOrderCard({ order }: { order: SurgicalOrderResponse }) {
  const router = useRouter();
  const when =
    order.scheduledAppointmentStart
      ? new Intl.DateTimeFormat("es-PE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(order.scheduledAppointmentStart))
      : "Sin programación";

  return (
    <Card className="relative flex flex-col overflow-hidden shadow-sm bg-card rounded-lg pt-0 border-2 border-l-8 border-indigo-500">
      <div className="absolute right-3 top-3 z-10">
        <Badge className="gap-1 text-xs text-white shadow-sm bg-indigo-600">
          {order.status === SurgicalOrderStatus.PENDING ? "Pendiente" : order.status}
        </Badge>
      </div>
      <CardContent className="p-4 flex flex-col gap-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h4 className="text-xl font-bold text-foreground truncate">{order.recommendedServiceName}</h4>
            <div className="mt-1 text-sm text-muted-foreground truncate flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span>Orden #{order.id}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Paciente: {order.animalName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Solicitante: {order.requestedByFullName ?? "Sin asignar"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-4 w-4 text-blue-500" />
            <span>{when}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-muted-foreground font-semibold h-9"
            onClick={() => router.push(`/dashboard/clinical/operating-room/orders/${order.id}`)}
          >
            Ver orden
            <MoveRight className="h-3.5 w-3.5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
