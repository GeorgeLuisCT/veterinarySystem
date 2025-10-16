"use client";

import React, { useEffect, useMemo, useState } from "react";
import { addMinutes, endOfDay, endOfMonth, endOfWeek, format, isValid, parseISO, startOfDay, startOfMonth, startOfWeek } from "date-fns";

import { useIsMobile } from "@/hooks/use-mobile";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { CalendarMain } from "@/components/calendar/calendar-main";
import { MobileNavigation } from "@/components/calendar/mobile-navigation";
import { CalendarModal } from "@/components/calendar/calendar-modal";
import { AnalyticsModal } from "@/components/calendar/analytics-modal";
import DashboardLayoutSection from "../../dashboard-layout-section";
import { SearchModal } from "@/components/calendar/search-modal";
import { SettingsModal } from "@/components/calendar/settings-modal";
import { FilterModal } from "@/components/calendar/filter-modal";
import { BarChart3, Download, Filter, Plus, Search, Settings } from "lucide-react";
import { HeaderAction } from "@/types/header-calendar-actions";
import NewAppointmentModal from "../components/new-appointment-modal";
import AppointmentDetailModal from "../components/appointment-detail-modal";
import { useCalendar, type Calendar, type CalendarEvent, type CalendarView } from "@/components/calendar/calendar-context";
import AppointmentService from "../service/appointment-service";
import { AppointmentSummaryResponse } from "../types/appointment-response";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { AppointmentType, AppointmentTypeLabels } from "../enums/appointment-type";
import { AppointmentStatus, AppointmentStatusLabels } from "../enums/appointment-status";

const DEFAULT_EVENT_COLOR = "#2563EB";
const DEFAULT_DURATION_MINUTES = 30;
const MIN_DURATION_MINUTES = 15;

const APPOINTMENT_TYPE_LABELS = AppointmentTypeLabels;
const APPOINTMENT_STATUS_LABELS = AppointmentStatusLabels;

const APPOINTMENT_TYPE_COLORS: Record<AppointmentType, string> = {
  [AppointmentType.CLINIC]: "#3B82F6",
  [AppointmentType.GROOMING]: "#EC4899",
  [AppointmentType.SURGERY]: "#DC2626",
};

const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: "#2563EB",
  [AppointmentStatus.CONFIRMED]: "#0EA5E9",
  [AppointmentStatus.CHECKED_IN]: "#10B981",
  [AppointmentStatus.IN_PROGRESS]: "#F59E0B",
  [AppointmentStatus.COMPLETED]: "#22C55E",
  [AppointmentStatus.CANCELED]: "#EF4444",
  [AppointmentStatus.NO_SHOW]: "#9CA3AF",
};

const weekStartOptions = { weekStartsOn: 0 as const };

const getTypeCalendarId = (type: AppointmentType) => `type-${type.toLowerCase()}`;
const getStatusCalendarId = (status: AppointmentStatus) => `status-${status.toLowerCase()}`;

const parseDateTime = (value: string): Date => {
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : new Date();
};

const mapAppointmentToEvent = (appointment: AppointmentSummaryResponse): CalendarEvent => {
  const start = parseDateTime(appointment.startDateTime);
  const duration = appointment.estimatedDurationMinutes && appointment.estimatedDurationMinutes > 0
    ? appointment.estimatedDurationMinutes
    : DEFAULT_DURATION_MINUTES;

  const safeDuration = Math.max(duration, MIN_DURATION_MINUTES);
  const end = addMinutes(start, safeDuration);

  const type = appointment.type;
  const color = APPOINTMENT_TYPE_COLORS[type] ?? DEFAULT_EVENT_COLOR;
  const calendarId = getTypeCalendarId(type);

  const title = `${appointment.animalName} • ${APPOINTMENT_TYPE_LABELS[type]}`;
  const statusLabel = APPOINTMENT_STATUS_LABELS[appointment.status] ?? appointment.status;

  const descriptionParts = [`Estado: ${statusLabel}`];
  if (appointment.assignedEmployeeFullName) {
    descriptionParts.push(`Profesional: ${appointment.assignedEmployeeFullName}`);
  }
  if (appointment.branch?.name) {
    descriptionParts.push(`Sucursal: ${appointment.branch.name}`);
  }

  return {
    id: String(appointment.id),
    title,
    description: descriptionParts.join(" | "),
    startDate: start,
    endDate: end,
    color,
    category: statusLabel,
    location: appointment.branch?.name ?? APPOINTMENT_TYPE_LABELS[type],
    calendarId,
    attendees: appointment.assignedEmployeeFullName ? [appointment.assignedEmployeeFullName] : undefined,
    metadata: {
      appointmentId: appointment.id,
      appointmentType: appointment.type,
      appointmentStatus: appointment.status,
      statusCalendarId: getStatusCalendarId(appointment.status),
    },
  };
};

const getDateRange = (view: CalendarView, date: Date) => {
  switch (view) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "week":
      return { start: startOfWeek(date, weekStartOptions), end: endOfWeek(date, weekStartOptions) };
    case "month":
    default: {
      const start = startOfWeek(startOfMonth(date), weekStartOptions);
      const end = endOfWeek(endOfMonth(date), weekStartOptions);
      return { start, end };
    }
  }
};

// --- COMPONENTE PRINCIPAL ---
export default function CalendarPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const {
    currentDate,
    view,
    setEvents,
    setIsLoading,
    selectedEvent,
    setSelectedEvent,
    isEventModalOpen,
    setIsEventModalOpen,
    setCalendars,
    setSecondaryCalendars,
  } = useCalendar();

  const [modals, setModals] = useState({
    search: false,
    settings: false,
    filter: false,
    analytics: false,
  });
  const [newAppointmentState, setNewAppointmentState] = useState<{ open: boolean; date: Date | null }>({
    open: false,
    date: null,
  });
  const [detailState, setDetailState] = useState<{ open: boolean; appointmentId: number | null }>({
    open: false,
    appointmentId: null,
  });
  const [reloadCounter, setReloadCounter] = useState(0);
  const { typeCalendars, statusCalendars } = useMemo(() => {
    const now = new Date();

    const typeCalendars: Calendar[] = (Object.values(AppointmentType) as AppointmentType[]).map(
      (type, index) => ({
        id: getTypeCalendarId(type),
        name: `${APPOINTMENT_TYPE_LABELS[type]}`,
        color: APPOINTMENT_TYPE_COLORS[type] ?? DEFAULT_EVENT_COLOR,
        description: `Citas de tipo ${APPOINTMENT_TYPE_LABELS[type]}`,
        isVisible: true,
        isDefault: index === 0,
        type: "work",
        createdAt: now,
      }),
    );

    const statusCalendars: Calendar[] = (Object.values(AppointmentStatus) as AppointmentStatus[]).map((status) => ({
      id: getStatusCalendarId(status),
      name: `${APPOINTMENT_STATUS_LABELS[status]}`,
      color: APPOINTMENT_STATUS_COLORS[status] ?? DEFAULT_EVENT_COLOR,
      description: `Citas con estado ${APPOINTMENT_STATUS_LABELS[status]}`,
      isVisible: true,
      type: "other",
      createdAt: now,
    }));

    return { typeCalendars, statusCalendars };
  }, []);

  useEffect(() => {
    setCalendars(typeCalendars);
    setSecondaryCalendars(statusCalendars);
  }, [setCalendars, setSecondaryCalendars, statusCalendars, typeCalendars]);

  useEffect(() => {
    if (!isEventModalOpen) return;

    if (selectedEvent) {
      const rawId =
        typeof selectedEvent.metadata?.appointmentId === "number"
          ? selectedEvent.metadata.appointmentId
          : Number(selectedEvent.id);

      if (!Number.isFinite(rawId)) {
        setIsEventModalOpen(false);
        return;
      }

      setDetailState({ open: true, appointmentId: rawId });
      setIsEventModalOpen(false);
    } else {
      setSelectedEvent(null);
      setNewAppointmentState({ open: true, date: new Date(currentDate) });
      setIsEventModalOpen(false);
    }
  }, [currentDate, isEventModalOpen, selectedEvent, setIsEventModalOpen, setSelectedEvent]);

  useEffect(() => {
    let active = true;
    const { start, end } = getDateRange(view, currentDate);

    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const appointments = await AppointmentService.list({
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
        });

        if (!active) return;

        const nextEvents = appointments.map(mapAppointmentToEvent);
        setSelectedEvent(null);
        setEvents(nextEvents);
      } catch (error) {
        if (!active) return;
        setSelectedEvent(null);
        setEvents([]);
        toast({
          variant: "destructive",
          title: "Error al cargar citas",
          description: getAaxiosErrorMessage(error) ?? "No se pudieron obtener las citas del calendario.",
        });
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchAppointments();

    return () => {
      active = false;
    };
  }, [currentDate, view, reloadCounter, setEvents, setIsLoading, setSelectedEvent, toast]);

  const actions: HeaderAction[] = [
    { key: "filter", icon: Filter, label: "Filter", tooltip: "Filtrar eventos" },
    { key: "search", icon: Search, label: "Search", tooltip: "Buscar eventos" },
    { key: "analytics", icon: BarChart3, label: "Analytics", tooltip: "Analítica del calendario" },
    { key: "export", icon: Download, label: "Export", tooltip: "Exportar calendario" },
    { key: "settings", icon: Settings, label: "Settings", tooltip: "Configuración" },
  ];

  const onAction = (key: string) => {
    switch (key) {
      case "search":
        setModals((m) => ({ ...m, search: true }));
        break;
      case "settings":
        setModals((m) => ({ ...m, settings: true }));
        break;
      case "filter":
        setModals((m) => ({ ...m, filter: true }));
        break;
      case "analytics":
        setModals((m) => ({ ...m, analytics: true }));
        break;
      case "export":
        customExport();
        break;
      case "new-event":
        setSelectedEvent(null);
        setNewAppointmentState({ open: true, date: new Date(currentDate) });
        break;
    }
  };

  const customExport = () => {
    console.log("Export personalizado");
  };

  return (
    <DashboardLayoutSection>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <CalendarHeader
          titleOverride="Agenda"
          actions={actions}
          onAction={onAction}
          primaryAction={{
            key: "new-event",
            label: "Crear cita",
            icon: Plus,
          }}
        />
        <SearchModal isOpen={modals.search} onClose={() => setModals((m) => ({ ...m, search: false }))} />
        <SettingsModal isOpen={modals.settings} onClose={() => setModals((m) => ({ ...m, settings: false }))} />
        <FilterModal isOpen={modals.filter} onClose={() => setModals((m) => ({ ...m, filter: false }))} />
        <AnalyticsModal isOpen={modals.analytics} onClose={() => setModals((m) => ({ ...m, analytics: false }))} />
        <NewAppointmentModal
          open={newAppointmentState.open}
          initialDateTime={newAppointmentState.date}
          onOpenChange={(open) => {
            if (!open) {
              setNewAppointmentState({ open: false, date: null });
            }
          }}
          onCreated={() => {
            setReloadCounter((prev) => prev + 1);
            setNewAppointmentState({ open: false, date: null });
          }}
        />
        <AppointmentDetailModal
          open={detailState.open}
          appointmentId={detailState.appointmentId}
          onClose={() => {
            setDetailState({ open: false, appointmentId: null });
            setSelectedEvent(null);
          }}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <CalendarSidebar
            primaryTitle="Tipos de cita"
            secondaryTitle="Estados de cita"
            primaryReadOnly
            secondaryReadOnly
          />
          <CalendarMain />
          {isMobile && <MobileNavigation />}
        </div>
        <CalendarModal />
      </div>
    </DashboardLayoutSection>
  );
}
