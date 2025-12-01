"use client";

import React, { useEffect, useMemo, useState } from "react";
import { addMinutes, endOfDay, endOfMonth, endOfWeek, format, isValid, parseISO, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { CalendarMain } from "@/components/calendar/calendar-main";
import { MobileNavigation } from "@/components/calendar/mobile-navigation";
import { CalendarModal } from "@/components/calendar/calendar-modal";
import DashboardLayoutSection from "../../dashboard-layout-section";
import { SearchModal } from "@/components/calendar/search-modal";
import { SettingsModal } from "@/components/calendar/settings-modal";
import { FilterModal } from "@/components/calendar/filter-modal";
import { BarChart3, Download, Filter, Plus, Search, Settings } from "lucide-react";
import { HeaderAction } from "@/types/header-calendar-actions";
import { useCalendar, type Calendar, type CalendarEvent, type CalendarView } from "@/components/calendar/calendar-context";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import VisitService from "../services/visit-service";
import { FieldVisitStatus, FieldVisitStatusLabels } from "../enums/field-visit-status";
import type { FieldVisitSummaryResponse } from "../types/visit-response";

const DEFAULT_EVENT_COLOR = "#059669";
const DEFAULT_DURATION_MINUTES = 60;

const STATUS_COLORS: Record<FieldVisitStatus, string> = {
  [FieldVisitStatus.PLANNED]: "#2563EB",
  [FieldVisitStatus.IN_PROGRESS]: "#F59E0B",
  [FieldVisitStatus.COMPLETED]: "#22C55E",
  [FieldVisitStatus.CANCELED]: "#EF4444",
};

const weekStartOptions = { weekStartsOn: 0 as const };

const getStatusCalendarId = (status: FieldVisitStatus) => `status-${status.toLowerCase()}`;

const parseDateTime = (value: string): Date => {
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : new Date();
};

const mapVisitToEvent = (v: FieldVisitSummaryResponse): CalendarEvent => {
  const start = parseDateTime(v.scheduledDateTime);
  const end = addMinutes(start, DEFAULT_DURATION_MINUTES);
  const color = STATUS_COLORS[v.status] ?? DEFAULT_EVENT_COLOR;
  const calendarId = getStatusCalendarId(v.status);
  const target = v.farmName ?? v.zoneName ?? "Sin destino";
  const companions = v.companions?.map((c) => c.employeeName) ?? [];
  const descriptionParts = [
    v.fieldVetName ? `Veterinario: ${v.fieldVetName}` : undefined,
    companions.length ? `Acompañantes: ${companions.join(", ")}` : undefined,
    v.objective ? `Objetivo: ${v.objective}` : undefined,
  ].filter(Boolean);
  const attendees = [v.fieldVetName, ...companions].filter(Boolean) as string[];
  return {
    id: String(v.id),
    title: target,
    description: descriptionParts.join(" | "),
    startDate: start,
    endDate: end,
    color,
    category: v.status,
    location: target,
    calendarId,
    attendees: attendees.length ? attendees : undefined,
    metadata: { visitId: v.id, statusCalendarId: calendarId },
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

export default function FieldCalendarPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { currentDate, view, setEvents, setIsLoading, selectedEvent, setSelectedEvent, isEventModalOpen, setIsEventModalOpen, setCalendars, setSecondaryCalendars } = useCalendar();
  const [modals, setModals] = useState({ search: false, settings: false, filter: false, analytics: false });

  const statusCalendars: Calendar[] = useMemo(() => {
    const now = new Date();
    return (Object.values(FieldVisitStatus) as FieldVisitStatus[]).map((status) => ({
      id: getStatusCalendarId(status),
      name: FieldVisitStatusLabels[status],
      color: STATUS_COLORS[status] ?? DEFAULT_EVENT_COLOR,
      description: `Visitas con estado ${FieldVisitStatusLabels[status]}`,
      isVisible: true,
      type: "other",
      createdAt: now,
    }));
  }, []);

  useEffect(() => {
    setCalendars([]);
    setSecondaryCalendars(statusCalendars);
  }, [setCalendars, setSecondaryCalendars, statusCalendars]);

  useEffect(() => {
    let active = true;
    const { start, end } = getDateRange(view, currentDate);

    const fetchVisits = async () => {
      setIsLoading(true);
      try {
        const normalizedStart = startOfDay(start);
        const normalizedEnd = endOfDay(end);
        const resp = await VisitService.list({
          from: format(normalizedStart, "yyyy-MM-dd'T'HH:mm:ss"),
          to: format(normalizedEnd, "yyyy-MM-dd'T'HH:mm:ss"),
        });
        if (!active) return;
        const events = resp.content.map(mapVisitToEvent);
        setSelectedEvent(null);
        setEvents(events);
      } catch (error) {
        if (!active) return;
        setSelectedEvent(null);
        setEvents([]);
        toast({ variant: 'destructive', title: 'Error al cargar visitas', description: getAaxiosErrorMessage(error) ?? 'No se pudieron obtener las visitas.' });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchVisits();
    return () => { active = false; };
  }, [currentDate, view, setEvents, setIsLoading, setSelectedEvent, toast]);

  const actions: HeaderAction[] = [
    { key: "filter", icon: Filter, label: "Filtrar", tooltip: "Filtrar eventos" },
    { key: "search", icon: Search, label: "Buscar", tooltip: "Buscar eventos" },
    { key: "analytics", icon: BarChart3, label: "Analytics", tooltip: "Analítica" },
    { key: "export", icon: Download, label: "Exportar", tooltip: "Exportar calendario" },
    { key: "settings", icon: Settings, label: "Config.", tooltip: "Configuración" },
  ];

  const onAction = (key: string) => {
    switch (key) {
      case "search": setModals(m => ({ ...m, search: true })); break;
      case "settings": setModals(m => ({ ...m, settings: true })); break;
      case "filter": setModals(m => ({ ...m, filter: true })); break;
      case "analytics": setModals(m => ({ ...m, analytics: true })); break;
      case "export": console.log('Export'); break;
      case "new-event": window.location.href = '/dashboard/fieldwork/visits'; break;
    }
  };

  useEffect(() => {
    if (!isEventModalOpen) return;
    if (selectedEvent) {
      const rawId = Number(selectedEvent.id);
      if (!Number.isFinite(rawId)) { setIsEventModalOpen(false); return; }
      window.location.href = `/dashboard/fieldwork/visits/${rawId}`;
      setIsEventModalOpen(false);
    } else {
      setSelectedEvent(null);
      setIsEventModalOpen(false);
    }
  }, [isEventModalOpen, selectedEvent, setIsEventModalOpen, setSelectedEvent]);

  return (
    <DashboardLayoutSection>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <CalendarHeader
          titleOverride="Calendario de Campo"
          actions={actions}
          onAction={onAction}
          primaryAction={{ key: 'new-event', label: 'Planificar visita', icon: Plus }}
        />
        <SearchModal isOpen={modals.search} onClose={() => setModals(m => ({ ...m, search: false }))} />
        <SettingsModal isOpen={modals.settings} onClose={() => setModals(m => ({ ...m, settings: false }))} />
        <FilterModal isOpen={modals.filter} onClose={() => setModals(m => ({ ...m, filter: false }))} />

        <div className="flex-1 flex overflow-hidden relative">
          <CalendarSidebar primaryTitle="Estados" secondaryTitle="Estados" showPrimaryCard={false} primaryReadOnly secondaryReadOnly />
          <CalendarMain />
          {isMobile && <MobileNavigation />}
        </div>
        <CalendarModal />
      </div>
    </DashboardLayoutSection>
  );
}
