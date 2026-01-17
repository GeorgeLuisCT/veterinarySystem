// app/dashboard/grooming/[id]/page.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import EmployeeService from "@/app/dashboard/staff/service/employee-service";
import { RoleName } from "@/enums/role-name";
import { EmployeeSummaryResponse } from "@/app/dashboard/staff/types/employee-summary-response";
import { GroomingSessionDetailResponse } from "../types/grooming-session-response";
import GroomingSessionForm, { Option, GroomingSessionFormHandle } from "../components/grooming-session-form";
import GroomingSessionService from "../service/grooming-session-service";
import { GroomingStatusLabels } from "../enums/grooming-status";
import PatientDetails from "../../clinical/components/consultory/patient-details";

const ensureOption = (options: Option[], id: number | null, label: string | null) => {
  if (!id || !label) return options;
  const exists = options.some((option) => Number(option.value) === id);
  if (exists) return options;
  return [...options, { value: String(id), label }];
};

export default function GroomingSessionDetailPage() {
  const params = useParams();
  const idParam = params?.id;
  const { toast } = useToast();

  const [attentionId, setAttentionId] = useState<number | null>(null);
  const [detail, setDetail] = useState<GroomingSessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [optionsLoading, setOptionsLoading] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<Option[]>([]);

  const formRef = useRef<GroomingSessionFormHandle>(null);

  const fetchDetail = useCallback(async (attId: number) => {
    setLoading(true);
    try {
      const response = await GroomingSessionService.getOrCreateByAttention(attId);
      setDetail(response);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la sesión de peluquería." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!idParam) {
      setLoading(false);
      toast({ variant: "destructive", title: "Sesión no encontrada", description: "No se proporcionó un identificador válido." });
      return;
    }
    const numericId = Number(Array.isArray(idParam) ? idParam[0] : idParam);
    if (Number.isNaN(numericId)) {
      setLoading(false);
      toast({ variant: "destructive", title: "Identificador inválido", description: "El identificador no es un número válido." });
      return;
    }
    setAttentionId(numericId);
    void fetchDetail(numericId);
  }, [idParam, fetchDetail, toast]);

  useEffect(() => {
    if (!detail) return;
    let active = true;
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const [groomersRes] = await Promise.all([
          EmployeeService.getEmployeesByRoles([RoleName.ROLE_GROOMER]).catch(async () => {
            const fallback = await EmployeeService.getEmployeesByRoles([RoleName.ROLE_ASSISTANT]).catch(() => []);
            return fallback;
          }),
        ]);

        if (!active) return;

        const mapEmployees = (employees: EmployeeSummaryResponse[]) =>
          employees.map<Option>((e) => ({
            value: String(e.id),
            label: e.branchNames ? `${e.firstName} ${e.lastName} • ${e.branchNames}` : `${e.firstName} ${e.lastName}`,
          }));

        setEmployeeOptions(
          ensureOption(mapEmployees(groomersRes ?? []), detail.assignedProfessionalId, detail.assignedProfessionalFullName)
        );
      } finally {
        if (active) setOptionsLoading(false);
      }
    };
    void loadOptions();
    return () => {
      active = false;
    };
  }, [detail]);

  const handleSaveAll = async () => {
    if (!formRef.current) return;
    setSaving(true);
    try {
      await formRef.current.triggerSaveAll();
      toast({ title: "Cambios guardados", description: "La sesión se actualizó correctamente." });
      if (attentionId) await fetchDetail(attentionId);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando sesión de peluquería...
      </div>
    );
  }

  if (!detail || !attentionId) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">No se encontró la sesión solicitada.</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/grooming" className="inline-flex">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sesión #{detail.id}</h1>
              <p className="text-sm text-muted-foreground">
                Paciente: <span className="font-semibold text-pink-600">{detail.summary.animalBasicResponse.animalName}</span> • Atención #{detail.attentionId}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{GroomingStatusLabels[detail.status]}</Badge>
            <Button variant="outline" onClick={() => attentionId && fetchDetail(attentionId)} disabled={loading}>
              <Loader2 className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
            </Button>
            <Button variant="default" className="text-white " onClick={handleSaveAll} disabled={saving}>
              {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>) : (<><Save className="mr-2 h-4 w-4" /> Guardar cambios</>)}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row">
          <PatientDetails
            animalId={detail.summary.animalBasicResponse.animalId}
            className="w-full lg:basis-[30%] lg:shrink-0"
          />
          <div className="flex-1 rounded-2xl border border-border/50 bg-white p-4 shadow-sm">
            <GroomingSessionForm
              ref={formRef}
              sessionId={detail.id}
              detail={detail}
              setDetail={setDetail}
              employeeOptions={employeeOptions}
              employeesLoading={optionsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
