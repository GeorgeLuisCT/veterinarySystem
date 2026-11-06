"use client";

import EmployeeService from "@/app/dashboard/staff/service/employee-service";
import { FloatingLabelSelect } from "@/components/floating-label-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Clock3, Loader2, MapPin, PawPrint, Scissors, Stethoscope, Syringe, UserRound } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { AppointmentStatus, AppointmentStatusLabels } from "../enums/appointment-status";
import { AppointmentType, AppointmentTypeLabels } from "../enums/appointment-type";
import { AttentionStatus, AttentionStatusLabels } from "../enums/attention-status";
import AppointmentService from "../service/appointment-service";
import AttentionService from "../service/attention-service";
import type { AppointmentDetailResponse } from "../types/appointment-response";
import { CreateAttentionFromAppointmentForm, createAttentionFromAppointmentFormSchema, CreateAttentionFromAppointmentRequest } from "../types/attention-request";

interface AppointmentDetailModalProps {
  open: boolean;
  appointmentId: number | null;
  onClose: () => void;
}

const typeSections: Record<
  AppointmentType,
  {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    fields: Array<{
      label: string;
      accessor: (detail: AppointmentDetailResponse) => React.ReactNode;
      icon?: React.ComponentType<{ className?: string }>;
    }>;
  }
> = {
  CLINIC: {
    title: "Detalle clínico",
    icon: Stethoscope,
    accent: "bg-success-soft text-success-strong",
    fields: [
      {
        label: "Servicio",
        accessor: (detail) => detail.clinicalDetail?.clinicalServiceName ?? "-",
        icon: Stethoscope,
      },
      {
        label: "Veterinario",
        accessor: (detail) => detail.clinicalDetail?.veterinarianFullName ?? "-",
        icon: UserRound,
      },
      {
        label: "Motivo",
        accessor: (detail) => detail.clinicalDetail?.consultationReason ?? "-",
        icon: CalendarDays,
      },
      {
        label: "Notas clínicas",
        accessor: (detail) => detail.clinicalDetail?.clinicalNotes ?? "-",
        icon: Clock3,
      },
    ],
  },
  GROOMING: {
    title: "Detalle de peluquería",
    icon: Scissors,
    accent: "bg-pink-100 text-pink-700",
    fields: [
      {
        label: "Servicio",
        accessor: (detail) => detail.groomingDetail?.clinicalServiceName ?? "-",
        icon: Scissors,
      },
      {
        label: "Estilista",
        accessor: (detail) => detail.groomingDetail?.stylistFullName ?? "-",
        icon: UserRound,
      },
      {
        label: "Notas especiales",
        accessor: (detail) => detail.groomingDetail?.ownerSpecialNotes ?? "-",
        icon: CalendarDays,
      },
    ],
  },
  SURGERY: {
    title: "Detalle quirúrgico",
    icon: Syringe,
    accent: "bg-info-soft text-info-strong",
    fields: [
      {
        label: "Servicio final",
        accessor: (detail) => detail.surgicalDetail?.finalServiceName ?? "-",
        icon: Syringe,
      },
      {
        label: "Cirujano",
        accessor: (detail) => detail.surgicalDetail?.surgeonFullName ?? "-",
        icon: UserRound,
      },
      {
        label: "Anestesista",
        accessor: (detail) => detail.surgicalDetail?.anesthetistFullName ?? "-",
        icon: UserRound,
      },
      {
        label: "Quirófano",
        accessor: (detail) => detail.surgicalDetail?.operatingRoomName ?? "-",
        icon: MapPin,
      },
      {
        label: "Instrucciones",
        accessor: (detail) => detail.surgicalDetail?.prepInstructions ?? "-",
        icon: CalendarDays,
      },
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
  const attentionHeadingId = React.useId();

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
    setShowAttentionForm(false);
  };

  const branchId = detail?.branch?.id;
  const canCreateAttention = detail?.status === AppointmentStatus.SCHEDULED;

  React.useEffect(() => {
    if (!canCreateAttention && showAttentionForm) {
      setShowAttentionForm(false);
    }
  }, [canCreateAttention, showAttentionForm]);

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
    const startDate = new Date(appointment.startDateTime);
    const dateLabel = format(startDate, "EEEE d 'de' MMMM yyyy", { locale: es });
    const timeLabel = format(startDate, "p", { locale: es });
    const duration = appointment.estimatedDurationMinutes
      ? `${appointment.estimatedDurationMinutes} min`
      : "Sin duración definida";
    const branchName = appointment.branch?.name ?? "Sin sucursal asignada";

    return (
      <InfoSection title="Programación" icon={CalendarDays} iconClassName="bg-info-soft text-info-strong">
        <InfoRow
          label="Sucursal"
          icon={MapPin}
        >
          {branchName}
        </InfoRow>
        <InfoRow
          label="Fecha y hora"
          icon={CalendarDays}
          description={
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5 opacity-60" /> {timeLabel} · {duration}
            </span>
          }
        >
          {dateLabel}
        </InfoRow>
      </InfoSection>
    );
  };

  const renderAssignedInfo = (appointment: AppointmentDetailResponse) => (
    <InfoSection title="Asignación" icon={PawPrint} iconClassName="bg-danger-soft text-danger-strong">
      <InfoRow label="Paciente" icon={PawPrint}>
        {appointment.animalName}
      </InfoRow>
      <InfoRow label="Profesional asignado" icon={UserRound} description="Responsable previsto para esta cita.">
        {appointment.assignedEmployeeFullName ?? "Sin asignar"}
      </InfoRow>
    </InfoSection>
  );

  const renderTypeSection = (appointment: AppointmentDetailResponse) => {
    const section = typeSections[appointment.type];
    if (!section) return null;

    return (
      <InfoSection title={section.title} icon={section.icon} iconClassName={section.accent}>
        <div className="grid gap-3 md:grid-cols-2">
          {section.fields.map((field) => (
            <InfoRow key={field.label} label={field.label} icon={field.icon}>
              {field.accessor(appointment) || "-"}
            </InfoRow>
          ))}
        </div>
      </InfoSection>
    );
  };

  const statusBadge = (status: AppointmentStatus) => {
    const label = AppointmentStatusLabels[status] ?? status;
    const variantClass =
      status === AppointmentStatus.SCHEDULED
        ? "bg-info-soft text-info-strong"
        : status === AppointmentStatus.CONFIRMED
          ? "bg-success-soft text-success-strong"
          : status === AppointmentStatus.CANCELED
            ? "bg-danger-soft text-danger-strong"
            : "bg-muted text-foreground";

    return <Badge className={variantClass}>{label}</Badge>;
  };

  const statusIndicatorColor = (status: AppointmentStatus) => {
    if (status === AppointmentStatus.CANCELED) return "bg-red-500";
    if (status === AppointmentStatus.CONFIRMED) return "bg-emerald-500";
    if (status === AppointmentStatus.COMPLETED) return "bg-muted-foreground";
    return "bg-amber-400";
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) handleClose(); }}>
      <DialogContent className="sm:max-w-3xl">
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
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{AppointmentTypeLabels[detail.type]}</Badge>
                {statusBadge(detail.status)}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {renderScheduleInfo(detail)}
                {renderAssignedInfo(detail)}
              </div>

              {renderTypeSection(detail)}

              <section
                className="rounded-lg border border-border bg-card/50 p-4"
                aria-labelledby={attentionHeadingId}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${statusIndicatorColor(detail.status)}`}
                    />
                    <span>
                      <span className="font-medium text-foreground">Estado actual:</span>{" "}
                      <span className="text-muted-foreground">
                        {AppointmentStatusLabels[detail.status]}
                      </span>
                    </span>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {AttentionStatusLabels[AttentionStatus.WAITING]}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 id={attentionHeadingId} className="text-sm font-semibold text-foreground">
                      Registrar atención
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Estado inicial:{" "}
                      <span className="font-medium text-foreground">
                        {AttentionStatusLabels[AttentionStatus.WAITING]}
                      </span>
                      . El registro usará la hora actual.
                    </p>
                  </div>
                  {canCreateAttention && (
                    <Button
                      variant={showAttentionForm ? "secondary" : "default"}
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowAttentionForm((prev) => !prev)}
                      disabled={creatingAttention || employeesLoading || !branchId}
                    >
                      {showAttentionForm ? "Ocultar formulario" : "Crear atención"}
                      {!showAttentionForm && <span aria-hidden="true">→</span>}
                    </Button>
                  )}
                </div>

                {canCreateAttention && showAttentionForm && (
                  <Form {...attentionForm}>
                    <form
                      onSubmit={handleCreateAttention}
                      className="mt-4 space-y-4 rounded-lg border border-dashed border-border bg-muted/30 p-4"
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
                          <FormItem className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
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
              </section>
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

interface InfoSectionProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  children: React.ReactNode;
}

function InfoSection({ title, description, icon: Icon, iconClassName, children }: InfoSectionProps) {
  const sectionId = React.useId();
  return (
    <section
      aria-labelledby={sectionId}
      className="rounded-lg border border-border bg-card/50 p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={`rounded-lg p-2 ${iconClassName ?? "bg-muted text-foreground"}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="flex flex-col gap-1">
          <h3 id={sectionId} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm">{children}</div>
    </section>
  );
}

interface InfoRowProps {
  label: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}

interface InfoRowProps {
  label: string;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function InfoRow({ label, children, description, icon: Icon }: InfoRowProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/80 p-3">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="rounded-lg bg-muted p-1.5 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="flex flex-col">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="text-sm font-medium text-foreground">{children}</span>
        </div>
      </div>
      {description && <div className="mt-2 text-xs text-muted-foreground">{description}</div>}
    </div>
  );
}
