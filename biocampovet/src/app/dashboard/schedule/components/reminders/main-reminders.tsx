"use client";

import { AnimalSpecies, AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";
import DataTable, { type Action } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PaginatedResponse } from "@/types/paginated-response";
import type { ColumnDef } from "@tanstack/react-table";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ReminderStatus, ReminderStatusLabels } from "../../enums/reminder-status";
import { ReminderType, ReminderTypeLabels } from "../../enums/reminder-type";
import ReminderService from "../../service/reminder-service";
import { ReminderListItemResponse, ReminderListParams } from "../../types/reminder-response";
import { CreateReminderDialog } from "./create-reminder-dialog";
import { DeleteReminderDialog } from "./delete-reminder-dialog";
import RemindersFilterBar, { type FilterState } from "./reminders-filter-bar";

const DEFAULT_FILTERS: FilterState = {
  query: "",
  types: [],
  statuses: [],
  includeManual: true,
  includeAutomatic: true,
};

const STATUS_COLORS: Record<ReminderStatus, string> = {
  [ReminderStatus.PENDING]: "bg-amber-100 text-amber-900",
  [ReminderStatus.SENT]: "bg-blue-100 text-blue-900",
  [ReminderStatus.COMPLETED]: "bg-emerald-100 text-emerald-900",
};

const TYPE_COLORS: Partial<Record<ReminderType, string>> = {
  [ReminderType.VACCINATION]: "bg-purple-100 text-purple-900",
  [ReminderType.DEWORMING]: "bg-rose-100 text-rose-900",
  [ReminderType.CHECKUP]: "bg-blue-100 text-blue-900",
  [ReminderType.GROOMING]: "bg-teal-100 text-teal-900",
  [ReminderType.LAB_TEST]: "bg-slate-100 text-slate-900",
  [ReminderType.SURGERY_FOLLOWUP]: "bg-orange-100 text-orange-900",
  [ReminderType.DENTAL_CARE]: "bg-amber-100 text-amber-900",
};

const buildParams = (
  filters: FilterState,
  page: number,
  size: number
): ReminderListParams => ({
  page,
  size,
  query: filters.query || undefined,
  types: filters.types.length ? filters.types : undefined,
  statuses: filters.statuses.length ? filters.statuses : undefined,
  dueFrom: filters.dueFrom,
  dueTo: filters.dueTo,
  includeManual: filters.includeManual,
  includeAutomatic: filters.includeAutomatic,
});

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd 'de' MMMM, yyyy", { locale: es });
}

function formatRelativeDue(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);
  const diff = differenceInDays(due, today);
  if (Number.isNaN(diff)) return "";
  if (diff === 0) return "Vence hoy";
  if (diff > 0) return `Faltan ${diff} día${diff === 1 ? "" : "s"}`;
  const overdue = Math.abs(diff);
  return `Atrasado ${overdue} día${overdue === 1 ? "" : "s"}`;
}

export default function MainRemindersPage() {
  const { toast } = useToast();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [pageData, setPageData] =
    useState<PaginatedResponse<ReminderListItemResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters, pageIndex, pageSize);
      const response = await ReminderService.list(params);
      setPageData(response);
    } catch (err) {
      console.error(err);
      const msg = "No pudimos cargar los recordatorios. Intenta nuevamente.";
      setError(msg);
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setLoading(false);
    }
  }, [filters, pageIndex, pageSize, toast]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const columns = useMemo<ColumnDef<ReminderListItemResponse>[]>(() => {
    return [
      {
        id: "patient",
        header: "Paciente / Propietario",
        cell: ({ row }) => {
          const reminder = row.original;
          const animalSpeciesLabel =
            AnimalSpeciesLabels[reminder.animalSpecies as AnimalSpecies] ?? "";
          return (
            <div>
              <div className="font-medium text-foreground">
                {reminder.animalName}
              </div>
              <div className="text-xs text-muted-foreground">
                {animalSpeciesLabel && `${animalSpeciesLabel} • `}
                {reminder.ownerName ?? "Sin propietario"}
                {reminder.ownerPhone && ` • ${reminder.ownerPhone}`}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "reminderType",
        header: "Tipo",
        cell: ({ row }) => {
          const reminder = row.original;
          const typeColor =
            TYPE_COLORS[reminder.reminderType] ?? "bg-slate-100 text-slate-900";
          return (
            <div className="flex flex-col gap-1">
              <Badge className={cn("w-fit", typeColor)}>
                {ReminderTypeLabels[reminder.reminderType]}
              </Badge>
              <span
                className="max-w-[220px] truncate text-xs text-muted-foreground"
                title={reminder.subject}
              >
                {reminder.subject}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "dueDate",
        header: "Fecha objetivo",
        cell: ({ row }) => {
          const reminder = row.original;
          const relativeLabel = formatRelativeDue(reminder.dueDate);
          return (
            <div>
              <div className="text-sm font-semibold text-foreground">
                {formatDate(reminder.dueDate)}
              </div>
              <div
                className={cn(
                  "text-xs",
                  relativeLabel.includes("Atrasado")
                    ? "text-amber-600"
                    : "text-muted-foreground"
                )}
              >
                {relativeLabel}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const reminder = row.original;
          const statusColor =
            STATUS_COLORS[reminder.status] ?? "bg-slate-100 text-slate-900";
          return (
            <Badge className={cn("w-fit", statusColor)}>
              {ReminderStatusLabels[reminder.status]}
            </Badge>
          );
        },
      },
      {
        id: "origin",
        header: "Origen",
        cell: ({ row }) => {
          const reminder = row.original;
          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant="secondary"
                className={cn("w-fit", !reminder.deletable && "opacity-80")}
              >
                {reminder.automatic ? "Automático" : "Manual"}
              </Badge>
              {reminder.branchName && (
                <span className="text-xs text-muted-foreground">
                  Sucursal: {reminder.branchName}
                </span>
              )}
              {reminder.detail && (
                <span
                  className="max-w-[220px] truncate text-xs text-muted-foreground"
                  title={reminder.detail}
                >
                  {reminder.detail}
                </span>
              )}
            </div>
          );
        },
      },
    ];
  }, []);

  const handleWhatsAppSend = useCallback((row: ReminderListItemResponse) => {
    if (!row.ownerPhone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Este recordatorio no tiene un número de teléfono asociado.",
      });
      return;
    }

    const message = `Hola! Le recordamos sobre: ${ReminderTypeLabels[row.reminderType]} para ${row.animalName}.\nFecha programada: ${formatDate(row.dueDate)}.\nSaludos desde Veterinaria & Spa Coryvet!`;
    const encodedMessage = encodeURIComponent(message);
    const phone = row.ownerPhone.replace(/[^0-9]/g, "");
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  }, [toast]);

  const handleEmailSend = useCallback((row: ReminderListItemResponse) => {
    if (!row.ownerEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Este recordatorio no tiene un correo electrónico asociado.",
      });
      return;
    }

    const subject = `Recordatorio: ${ReminderTypeLabels[row.reminderType]} - ${row.animalName}`;
    const body = `Estimado/a ${row.ownerName || "propietario"},\n\nLe recordamos sobre: ${ReminderTypeLabels[row.reminderType]} para ${row.animalName}.\nFecha programada: ${formatDate(row.dueDate)}.\n\nSaludos cordiales,\nBiocampoVet`;

    const mailtoUrl = `mailto:${row.ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
  }, [toast]);

  const handleMarkAsCompleted = useCallback(async (row: ReminderListItemResponse) => {
    if (!row.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se puede marcar como completado un recordatorio automático.",
      });
      return;
    }

    try {
      await ReminderService.updateStatus(row.id, ReminderStatus.COMPLETED);
      toast({
        title: "Completado",
        description: "El recordatorio ha sido marcado como completado.",
      });
      loadReminders();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el recordatorio. Intenta nuevamente.",
      });
    }
  }, [toast, loadReminders]);

  const actions = useMemo<Action<ReminderListItemResponse>[]>(() => {
    return [
      {
        label: "Enviar WhatsApp",
        type: "direct",
        icon: <MessageSquare className="h-4 w-4" />,
        onClick: handleWhatsAppSend,
        disabled: (row: ReminderListItemResponse) => row.status !== ReminderStatus.PENDING,
      },
      {
        label: "Enviar email",
        type: "direct",
        icon: <Mail className="h-4 w-4" />,
        onClick: handleEmailSend,
        disabled: (row: ReminderListItemResponse) => row.status !== ReminderStatus.PENDING,
      },
      {
        label: "Marcar como concluído",
        type: "dropdown",
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: handleMarkAsCompleted,
        disabled: (row: ReminderListItemResponse) => row.status !== ReminderStatus.PENDING,
      },
      {
        label: "Eliminar recordatorio",
        type: "dropdown",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: (row: ReminderListItemResponse) => setDeleteTarget(row.id),
        disabled: (row: ReminderListItemResponse) => !row.deletable,
      },
    ];
  }, [handleWhatsAppSend, handleEmailSend, handleMarkAsCompleted]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <CalendarClock className="h-6 w-6 text-primary" /> Centro de
            recordatorios
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los seguimientos preventivos y notificaciones automáticas
            para cada paciente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReminders}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" /> Actualizar
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo recordatorio
          </Button>
        </div>
      </div>

      <RemindersFilterBar
        value={filters}
        onChange={(f) => {
          setFilters(f);
          setPageIndex(0);
        }}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setPageIndex(0);
        }}
        onRefresh={loadReminders}
      />

      <Separator />

      {error && !loading && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div className="text-sm">
              <p className="font-semibold text-destructive">{error}</p>
              <p className="text-destructive/80">
                Intenta refrescar la lista o ajusta tus filtros.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && (
        <DataTable<ReminderListItemResponse>
          pageData={pageData}
          columns={columns}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
          actions={actions}
          loading={loading}
          emptyState={
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <CalendarClock className="h-8 w-8" />
              <p>
                No encontramos recordatorios con los filtros seleccionados.
              </p>
            </div>
          }
        />
      )}

      <CreateReminderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={loadReminders}
      />

      <DeleteReminderDialog
        open={!!deleteTarget}
        reminderId={deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onDeleted={loadReminders}
      />
    </>
  );
}