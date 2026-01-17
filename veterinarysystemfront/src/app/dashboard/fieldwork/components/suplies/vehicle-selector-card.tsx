"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VehicleService from "../../services/vehicle-service";
import type { VehicleResponse } from "../../types/vehicle-response";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";

export default function VehicleSelectorCard({ value, onChange, onRefresh }: { value: number | null; onChange: (id: number | null) => void; onRefresh?: () => void }) {
  const { toast } = useToast();
  const [vehicles, setVehicles] = React.useState<VehicleResponse[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await VehicleService.list();
      setVehicles(res);
      if (res.length && value == null) onChange(res[0].id);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getAaxiosErrorMessage(error) ?? "No se pudieron obtener los vehículos." });
    } finally {
      setLoading(false);
    }
  }, [onChange, toast, value]);

  React.useEffect(() => { load(); }, [load]);

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    if (raw === "") return onChange(null);
    const num = Number(raw);
    onChange(Number.isNaN(num) ? null : num);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehículo seleccionado</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <select className="rounded-md border bg-background p-2 text-sm" value={value == null ? "" : String(value)} onChange={handleVehicleChange}>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <Button variant="outline" onClick={() => { onRefresh?.(); }} disabled={value == null || loading}>
          Refrescar stock
        </Button>
      </CardContent>
    </Card>
  );
}