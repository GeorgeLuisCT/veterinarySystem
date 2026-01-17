"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { selectBranch } from "@/app/dashboard/branche/services/select-branch";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { Building2, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginSelectBranchProps {
  branches: BranchResponse[];
}

export function LoginSelectBranch({ branches }: LoginSelectBranchProps) {
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const handleBranchSelection = async () => {
    if (!selectedBranch) return;
    setLoading(true);
    setError("");

    try {
      const token = await selectBranch(selectedBranch);
      if (token) window.location.href = "/dashboard/pos/sales/new";
    } catch (err: unknown) {
      setError(getAaxiosErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl overflow-hidden border-0 p-0">
        {/* Banner estilo pastel */}
        <div className="relative h-28 w-full bg-gradient-to-r from-teal-500 to-cyan-500">
          <div className="absolute inset-0 opacity-20" />
          <div className="relative flex h-full items-center justify-center px-6 text-white">
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              <Building2 className="h-4 w-4" />
              Sucursales disponibles
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <DialogHeader className="p-0">
            <DialogTitle className="text-teal-900">
              Seleccione una sucursal para continuar
            </DialogTitle>
          </DialogHeader>

          {/* Grid de “radio-cards” */}
          <div className="grid gap-4 sm:grid-cols-2">
            {branches.map((branch) => {
              const isActive = selectedBranch === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setSelectedBranch(branch.id)}
                  onDoubleClick={handleBranchSelection}
                  className={cn(
                    "group text-left",
                    "rounded-2xl border bg-white transition",
                    "hover:shadow-lg hover:-translate-y-0.5",
                    isActive
                      ? "border-teal-500 ring-2 ring-teal-400"
                      : "border-teal-100"
                  )}
                >
                  <Card className="border-0 shadow-none">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200">
                            <Building2 className="h-4 w-4" />
                          </span>
                          {branch.name}
                        </CardTitle>

                        {/* Check de selección */}
                        <CheckCircle2
                          className={cn(
                            "h-5 w-5 transition",
                            isActive ? "text-teal-600 opacity-100" : "text-slate-300 opacity-0 group-hover:opacity-100"
                          )}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-5 pt-0">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        <span className="line-clamp-1">{branch.location ?? "—"}</span>
                      </div>

                      {/* Badge sutil de estado/ayuda visual */}
                      <div className="mt-3 inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
                        Click para seleccionar · Doble click para confirmar
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer fijo con CTA */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-white/80 p-4 backdrop-blur">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="text-slate-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleBranchSelection}
            disabled={!selectedBranch || loading}
            className="rounded-full bg-teal-600 hover:bg-teal-700"
          >
            {loading ? "Seleccionando…" : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
