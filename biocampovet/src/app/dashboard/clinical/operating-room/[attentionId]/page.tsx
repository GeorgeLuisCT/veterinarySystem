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
import { AttentionResponse } from "@/app/dashboard/schedule/types/attention-response";
import AttentionService from "@/app/dashboard/schedule/service/attention-service";
import PatientDetails from "../../components/consultory/patient-details";


const ensureOption = (options: Option[], attentionId: number | null, label: string | null) => {
  if (!attentionId || !label) return options;
  const exists = options.some((option) => Number(option.value) === attentionId);
  if (exists) return options;
  return [...options, { value: String(attentionId), label }];
};

export default function SurgicalReportDetailPage() {
  const params = useParams();
  const attentionIdParam = params?.attentionId;
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

  // ⬇️ NUEVO: estado para la atención y mostrar el nombre del servicio
  const [attention, setAttention] = useState<AttentionResponse | null>(null);

  const formRef = useRef<SurgicalReportFormHandle>(null);

  const fetchAttention = useCallback(async (attentionId: number) => {
    try {
      const res = await AttentionService.getById(attentionId);
      setAttention(res);
    } catch (error) {
      console.error("Error fetching attention by id:", error);
      setAttention(null);
      toast({
        variant: "destructive",
        title: "No se pudo cargar la atención",
        description: "Ocurrió un problema al obtener los datos del servicio.",
      });
    }
  }, [toast]);

  const fetchDetail = useCallback(async (attentionId: number) => {
    setLoading(true);
    try {
      const response = await SurgicalReportService.getOrCreateByAttention(attentionId);
      setDetail(response);
      setReportId(response.id);
      // ⬇️ NUEVO: traer también la atención para obtener el nombre del servicio
      void fetchAttention(attentionId);
    } catch (error) {
      console.error("Error fetching surgical report:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el reporte quirúrgico." });
    } finally {
      setLoading(false);
    }
  }, [fetchAttention, toast]);

  useEffect(() => {
    if (!attentionIdParam) {
      setLoading(false);
      toast({ variant: "destructive", title: "Reporte no encontrado", description: "No se proporcionó un identificador válido." });
      return;
    }
    const numericAttentionId = Number(Array.isArray(attentionIdParam) ? attentionIdParam[0] : attentionIdParam);
    if (Number.isNaN(numericAttentionId)) {
      setLoading(false);
      toast({ variant: "destructive", title: "Identificador inválido", description: "El identificador no es un número válido." });
      return;
    }
    void fetchDetail(numericAttentionId);
  }, [attentionIdParam, fetchDetail, toast]);

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
          label: `${e.firstName} ${e.lastName}`,
        }));

        setSurgeonOptions(ensureOption(mapEmployees(surgeonsRes ?? []), detail.surgeonId, detail.surgeonFullName));
        setAnesthetistOptions(ensureOption(mapEmployees(anesthetistsRes ?? []), detail.anesthesiologistId, detail.anesthesiologistFullName));
        setAssistantOptions(ensureOption(mapEmployees(assistantsRes ?? []), detail.assistantId, detail.assistantFullName));
        setOperatingRoomOptions(ensureOption(
          (roomsRes ?? []).map<Option>((room: any) => ({ value: String(room.id), label: room.name })),
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
    if (!formRef.current || !detail) return;
    setSaving(true);
    try {
      await formRef.current.triggerSaveAll();
      toast({ title: "Cambios guardados", description: "El reporte quirúrgico se actualizó correctamente." });
      // ⬇️ CORREGIDO: recargar por attentionId, no por reportId
      await fetchDetail(detail.attentionId);
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
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-5xl px-4 py-3 md:py-4">
          <div className="flex items-start justify-between gap-3">
            {/* IZQUIERDA */}
            <div className="min-w-0">
              {/* Servicio como título principal */}
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold leading-tight text-slate-900 md:text-xl">
                  {attention?.clinicalServiceName ?? "Servicio no especificado"}
                </h1>

                <Badge variant="secondary" className="text-xs tracking-wide">
                  {SurgicalReportStatusLabels[detail.status]}
                </Badge>
              </div>

              {/* Subtítulo y metadatos */}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">

                <span className="inline-flex max-w-[20rem] items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-200">
                  <span className="sr-only">Paciente</span>
                  <span className="truncate font-normal">{detail.summary.animalName}</span>
                </span>

                <span className="hidden md:inline select-none">·</span>
                <span className="rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200">
                  Reporte quirúrgico
                </span>

              </div>
            </div>

            {/* DERECHA: Acciones */}
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                onClick={() => detail && fetchDetail(detail.attentionId)}
                disabled={loading}
                aria-label="Actualizar"
              >
                <Loader2 className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>

              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleSaveAll}
                disabled={saving}
                aria-label="Guardar cambios"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>


      <div className="w-full flex flex-col gap-4 sm:flex-row pt-4 mx-2">

        <PatientDetails
          animalId={detail.summary.animalId}
          className="sm:basis-[21%] sm:shrink-0 w-full"
        />

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
          className="sm:basis-[79%] sm:min-w-0 w-full flex flex-col gap-4"
        />
      </div>
    </div>
  );
}
