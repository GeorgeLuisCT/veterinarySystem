"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import SurgicalReportService from "../../service/surgical-report-service";
import { SurgicalReportDetailResponse } from "../../types/surgical-report-response";
import { SurgicalReportStatusLabels } from "../../enums/surgical-report-status";
import EmployeeService from "@/app/dashboard/staff/employees/service/employee-service";
import { RoleName } from "@/enums/role-name";
import { EmployeeSummaryResponse } from "@/app/dashboard/staff/employees/types/employee-summary-response";
import { OperatingRoomService } from "@/app/dashboard/branche/services/operating-room-service";
import SurgicalReportForm, { Option, SurgicalReportFormHandle } from "../../components/operating-room/surgical-report-form";


const ensureOption = (options: Option[], id: number | null, label: string | null) => {
  if (!id || !label) return options;
  const exists = options.some((option) => Number(option.value) === id);
  if (exists) return options;
  return [...options, { value: String(id), label }];
};

export default function SurgicalReportDetailPage() {
  const params = useParams();
  const idParam = params?.id;
  const { toast } = useToast();

  const [reportId, setReportId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SurgicalReportDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [optionsLoading, setOptionsLoading] = useState(false);
  const [surgeonOptions, setSurgeonOptions] = useState<Option[]>([]);
  const [anesthetistOptions, setAnesthetistOptions] = useState<Option[]>([]);
  const [assistantOptions, setAssistantOptions] = useState<Option[]>([]);
  const [operatingRoomOptions, setOperatingRoomOptions] = useState<Option[]>([]);

  const formRef = useRef<SurgicalReportFormHandle>(null);

  const fetchDetail = useCallback(async (attentionId: number) => {
    setLoading(true);
    try {
      const response = await SurgicalReportService.getOrCreateByAttention(attentionId);
      console.log(response);
      setDetail(response);
    } catch (error) {
      console.error("Error fetching surgical report:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el reporte quirúrgico." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!idParam) {
      setLoading(false);
      toast({ variant: "destructive", title: "Reporte no encontrado", description: "No se proporcionó un identificador válido." });
      return;
    }
    const numericId = Number(Array.isArray(idParam) ? idParam[0] : idParam);
    if (Number.isNaN(numericId)) {
      setLoading(false);
      toast({ variant: "destructive", title: "Identificador inválido", description: "El identificador no es un número válido." });
      return;
    }
    setReportId(numericId);
    void fetchDetail(numericId);
  }, [idParam, fetchDetail, toast]);

  useEffect(() => {
    if (!detail) return;
    let active = true;
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const [surgeonsRes, anesthetistsRes, assistantsRes, roomsRes] = await Promise.all([
          EmployeeService.getEmployeesByRoles([RoleName.ROLE_VETERINARIAN]).catch(() => []),
          EmployeeService.getEmployeesByRoles([RoleName.ROLE_VETERINARIAN]).catch(() => []),
          EmployeeService.getEmployeesByRoles([RoleName.ROLE_ASSISTANT]).catch(() => []),
          detail.summary.branch?.id ? OperatingRoomService.listByBranch(detail.summary.branch.id).catch(() => []) : Promise.resolve([]),
        ]);
        if (!active) return;

        const mapEmployees = (employees: EmployeeSummaryResponse[]) => employees.map<Option>((e) => ({
          value: String(e.id),
          label: e.branchNames ? `${e.firstName} ${e.lastName} • ${e.branchNames}` : `${e.firstName} ${e.lastName}`,
        }));

        setSurgeonOptions(ensureOption(mapEmployees(surgeonsRes ?? []), detail.surgeonId, detail.surgeonFullName));
        setAnesthetistOptions(ensureOption(mapEmployees(anesthetistsRes ?? []), detail.anesthesiologistId, detail.anesthesiologistFullName));
        setAssistantOptions(ensureOption(mapEmployees(assistantsRes ?? []), detail.assistantId, detail.assistantFullName));
        setOperatingRoomOptions(ensureOption(
          (roomsRes ?? []).map<Option>((room: any) => ({ value: String(room.id), label: room.branchName ? `${room.branchName} • ${room.name}` : room.name })),
          detail.operatingRoomId,
          detail.operatingRoomName
        ));
      } finally {
        if (active) setOptionsLoading(false);
      }
    };
    void loadOptions();
    return () => { active = false; };
  }, [detail]);

  const handleSaveAll = async () => {
    if (!formRef.current) return;
    setSaving(true);
    try {
      await formRef.current.triggerSaveAll();
      toast({ title: "Cambios guardados", description: "El reporte quirúrgico se actualizó correctamente." });
      if (reportId) await fetchDetail(reportId);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando reporte quirúrgico...
      </div>
    );
  }

  if (!detail || !reportId) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">No se encontró el reporte solicitado.</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reporte quirúrgico #{detail.id}</h1>
            <p className="text-sm text-muted-foreground">
              Paciente: <span className="font-semibold text-blue-600">{detail.summary.animalName}</span> • Atención #{detail.attentionId}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{SurgicalReportStatusLabels[detail.status]}</Badge>
            <Button variant="outline" onClick={() => reportId && fetchDetail(reportId)} disabled={loading}>
              <Loader2 className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
            </Button>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleSaveAll} disabled={saving}>
              {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>) : (<><Save className="mr-2 h-4 w-4" /> Guardar cambios</>)}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <SurgicalReportForm
          ref={formRef}
          reportId={reportId}
          detail={detail}
          setDetail={setDetail}
          optionsLoading={optionsLoading}
          surgeonOptions={surgeonOptions}
          anesthetistOptions={anesthetistOptions}
          assistantOptions={assistantOptions}
          operatingRoomOptions={operatingRoomOptions}
        />
      </div>
    </div>
  );
}

