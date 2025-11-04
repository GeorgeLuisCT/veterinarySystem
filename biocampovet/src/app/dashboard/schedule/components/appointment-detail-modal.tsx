"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Switch } from "@/components/ui/switch";
import AppointmentService from "../service/appointment-service";
import AttentionService from "../service/attention-service";
import type { AppointmentDetailResponse } from "../types/appointment-response";
import { createAttentionFromAppointmentFormSchema, CreateAttentionFromAppointmentForm, CreateAttentionFromAppointmentRequest } from "../types/attention-request";
import { AppointmentStatus, AppointmentStatusLabels } from "../enums/appointment-status";
import { AppointmentType, AppointmentTypeLabels } from "../enums/appointment-type";
import { AttentionStatus, AttentionStatusLabels } from "../enums/attention-status";
import { Loader2 } from "lucide-react";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useToast } from "@/hooks/use-toast";
import EmployeeService from "@/app/dashboard/staff/service/employee-service";

interface AppointmentDetailModalProps {
  open: boolean;
  appointmentId: number | null;
  onClose: () => void;
}

const typeSections: Record<AppointmentType, { title: string; fields: Array<{ label: string; accessor: (detail: AppointmentDetailResponse) => React.ReactNode }> }> = {
  CLINIC: {
    title: "Detalle clínico",
    fields: [
      { label: "Servicio", accessor: (detail) => detail.clinicalDetail?.clinicalServiceName ?? "-" },
      { label: "Veterinario", accessor: (detail) => detail.clinicalDetail?.veterinarianFullName ?? "-" },
      { label: "Motivo", accessor: (detail) => detail.clinicalDetail?.consultationReason ?? "-" },
      { label: "Notas clínicas", accessor: (detail) => detail.clinicalDetail?.clinicalNotes ?? "-" },
    ],
  },
  GROOMING: {
    title: "Detalle de peluquería",
    fields: [
      { label: "Servicio", accessor: (detail) => detail.groomingDetail?.clinicalServiceName ?? "-" },
      { label: "Estilista", accessor: (detail) => detail.groomingDetail?.stylistFullName ?? "-" },
      { label: "Notas especiales", accessor: (detail) => detail.groomingDetail?.ownerSpecialNotes ?? "-" },
    ],
  },
  SURGERY: {
    title: "Detalle quirúrgico",
    fields: [
      { label: "Servicio final", accessor: (detail) => detail.surgicalDetail?.finalServiceName ?? "-" },
      { label: "Cirujano", accessor: (detail) => detail.surgicalDetail?.surgeonFullName ?? "-" },
      { label: "Anestesista", accessor: (detail) => detail.surgicalDetail?.anesthetistFullName ?? "-" },
      { label: "Quirófano", accessor: (detail) => detail.surgicalDetail?.operatingRoomName ?? "-" },
      { label: "Instrucciones", accessor: (detail) => detail.surgicalDetail?.prepInstructions ?? "-" },
    ],
  },
};

type EmployeeOption = {
  id: number;
  label: string;
};

export function AppointmentDetailModal({ open, appointmentId, onClose }: AppointmentDetailModalProps) {
  const [detail, setDetail] = React.useState<AppointmentDetailResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const [showAttentionForm, setShowAttentionForm] = React.useState(false);
  const [employeeOptions, setEmployeeOptions] = React.useState<EmployeeOption[]>([]);
  const [employeesLoading, setEmployeesLoading] = React.useState(false);
  const [creatingAttention, setCreatingAttention] = React.useState(false);

  const attentionForm = useForm<CreateAttentionFromAppointmentForm>({
    resolver: zodResolver(createAttentionFromAppointmentFormSchema),
    defaultValues: {
      attendingEmployeeId: undefined,
      emergency: false,
    },
  });

  React.useEffect(() => {
    if (!open || appointmentId == null) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    setDetail(null);

    (async () => {
      try {
        const response = await AppointmentService.getById(appointmentId);
        if (!active) return;
        setDetail(response);
      } catch (err) {
        if (!active) return;
        setError(getAaxiosErrorMessage(err) ?? "No se pudo cargar el detalle de la cita.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, appointmentId]);

  const handleClose = () => {
    onClose();
    setDetail(null);
    setError(null);
  };

  const branchId = detail?.branch?.id;

  const loadEmployees = React.useCallback(
    async (query?: string) => {
      if (!branchId) {
        setEmployeeOptions([]);
        return [];
      }

      setEmployeesLoading(true);

      const mergeWithAssigned = (options: EmployeeOption[]) => {
        if (detail?.assignedEmployeeId && detail.assignedEmployeeFullName) {
          const exists = options.some((option) => option.id === detail.assignedEmployeeId);
          if (!exists) {
            return [
              ...options,
              {
                id: detail.assignedEmployeeId,
                label: detail.assignedEmployeeFullName,
              },
            ];
          }
        }
        return options;
      };

      try {
        if (query?.trim()) {
          const results = await EmployeeService.searchEmployees(query.trim(), branchId);
          const options = results.map((employee) => ({
            id: employee.id,
            label: employee.fullName,
          }));
          const merged = mergeWithAssigned(options);
          setEmployeeOptions(merged);
          return merged;
        }

        const response = await EmployeeService.getEmployees({
          active: true,
          page: 0,
          size: 20,
          branchId,
        });

        const options = response.content.map((employee) => ({
          id: employee.id,
          label: `${employee.firstName} ${employee.lastName}`,
        }));
        const merged = mergeWithAssigned(options);
        setEmployeeOptions(merged);
        return merged;
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: getAaxiosErrorMessage(err) ?? "No se pudieron cargar los profesionales.",
        });
        setEmployeeOptions([]);
        return [];
      } finally {
        setEmployeesLoading(false);
      }
    },
    [branchId, detail?.assignedEmployeeFullName, detail?.assignedEmployeeId, toast]
  );

  React.useEffect(() => {
    if (!detail) {
      attentionForm.reset({
        attendingEmployeeId: undefined,
        emergency: false,
      });
      setEmployeeOptions([]);
      setShowAttentionForm(false);
      return;
    }

    attentionForm.reset({
      attendingEmployeeId: detail.assignedEmployeeId ?? undefined,
      emergency: false,
    });
    setShowAttentionForm(false);
    if (detail.branch?.id) {
      void loadEmployees();
    } else {
      setEmployeeOptions([]);
    }
  }, [detail, attentionForm, loadEmployees]);

  const handleSearchEmployees = React.useCallback(
    (query: string) => {
      void loadEmployees(query);
    },
    [loadEmployees]
  );

  const handleCreateAttention = attentionForm.handleSubmit(async (values) => {
    if (!detail) {
      return;
    }

    setCreatingAttention(true);
    try {
      const payload: CreateAttentionFromAppointmentRequest = {
        appointmentId: detail.id,
        attendingEmployeeId: values.attendingEmployeeId,
        emergency: values.emergency ?? false,
        checkInTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        status: AttentionStatus.WAITING,
      };

      await AttentionService.createFromAppointment(payload);
      toast({
        title: "Atención registrada",
        description: "Se creó la atención a partir de la cita.",
      });
      setShowAttentionForm(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error al registrar la atención",
        description: getAaxiosErrorMessage(err) ?? "No se pudo registrar la atención.",
      });
    } finally {
      setCreatingAttention(false);
    }
  });

  const renderScheduleInfo = (appointment: AppointmentDetailResponse) => {
    const start = format(new Date(appointment.startDateTime), "EEEE d 'de' MMMM yyyy HH:mm", { locale: es });
    const duration = appointment.estimatedDurationMinutes
      ? `${appointment.estimatedDurationMinutes} min`
      : "Sin duración definida";
    const branchLocation = appointment.branch.location.trim();
    const branchDisplay = branchLocation ? `${appointment.branch.name} • ${branchLocation}` : appointment.branch.name;

    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Inicio:</span>
          <span className="text-muted-foreground">{start}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Duración:</span>
          <span className="text-muted-foreground">{duration}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-medium text-foreground">Sucursal:</span>
          <span className="text-muted-foreground break-words">{branchDisplay}</span>
        </div>
      </div>
    );
  };

  const renderAssignedInfo = (appointment: AppointmentDetailResponse) => (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">Mascota:</span>
        <span className="text-muted-foreground">{appointment.animalName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">Profesional asignado:</span>
        <span className="text-muted-foreground">{appointment.assignedEmployeeFullName ?? "Sin asignar"}</span>
      </div>
    </div>
  );

  const renderTypeSection = (appointment: AppointmentDetailResponse) => {
    const section = typeSections[appointment.type];
    if (!section) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
        <div className="space-y-2 text-sm">
          {section.fields.map((field) => (
            <div key={field.label} className="flex gap-2">
              <span className="font-medium text-foreground w-32 shrink-0">{field.label}:</span>
              <span className="text-muted-foreground break-words">
                {field.accessor(appointment) || "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const statusBadge = (status: AppointmentStatus) => {
    const label = AppointmentStatusLabels[status] ?? status;
    const variantClass =
      status === AppointmentStatus.SCHEDULED
        ? "bg-blue-100 text-blue-800"
        : status === AppointmentStatus.CONFIRMED
        ? "bg-emerald-100 text-emerald-800"
        : status === AppointmentStatus.CANCELED
        ? "bg-red-100 text-red-800"
        : "bg-slate-100 text-slate-800";

    return <Badge className={variantClass}>{label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) handleClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detalle de la cita</DialogTitle>
          <DialogDescription>Consulta la información registrada para esta cita.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando detalle...
          </div>
        ) : error ? (
          <div className="py-6 text-sm text-destructive">{error}</div>
        ) : detail ? (
          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{AppointmentTypeLabels[detail.type]}</Badge>
                {statusBadge(detail.status)}
              </div>

              {renderScheduleInfo(detail)}

              <Separator />

              {renderAssignedInfo(detail)}

              <Separator />

              {renderTypeSection(detail)}

              <Separator />

              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Registrar atención</h3>
                    <p className="text-xs text-muted-foreground">
                      Estado inicial:{" "}
                      <span className="font-medium text-foreground">
                        {AttentionStatusLabels[AttentionStatus.WAITING]}
                      </span>.
                      El registro usará la hora actual.
                    </p>
                  </div>
                  <Button
                    variant={showAttentionForm ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowAttentionForm((prev) => !prev)}
                    disabled={creatingAttention || employeesLoading || !branchId}
                  >
                    {showAttentionForm ? "Ocultar formulario" : "Crear atención"}
                  </Button>
                </div>

                {showAttentionForm && (
                  <Form {...attentionForm}>
                    <form
                      onSubmit={handleCreateAttention}
                      className="space-y-4 rounded-md border border-border p-4"
                    >
                      <FormField
                        control={attentionForm.control}
                        name="attendingEmployeeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FloatingLabelSelect
                                id="attention-attendingEmployeeId"
                                label="Profesional responsable"
                                value={field.value ? String(field.value) : ""}
                                onValueChange={(value) => field.onChange(Number(value))}
                                options={employeeOptions.map((employee) => ({
                                  value: String(employee.id),
                                  label: employee.label,
                                }))}
                                onSearch={handleSearchEmployees}
                                disabled={creatingAttention || employeesLoading}
                                emptyMessage="No se encontraron profesionales."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={attentionForm.control}
                        name="emergency"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                            <div className="space-y-0.5">
                              <span className="text-sm font-medium text-foreground">Emergencia</span>
                              <p className="text-xs text-muted-foreground">
                                Activa esta opción si la atención requiere prioridad.
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value ?? false}
                                onCheckedChange={(checked) => field.onChange(checked)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAttentionForm(false)}
                          disabled={creatingAttention}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={creatingAttention}>
                          {creatingAttention && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Registrar atención
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-6 text-sm text-muted-foreground">Selecciona una cita para ver los detalles.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AppointmentDetailModal;
