"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type CalendarView = "month" | "week" | "day"

export interface Calendar {
  id: string
  name: string
  color: string
  description?: string
  isVisible: boolean
  isDefault?: boolean
  type: "personal" | "work" | "family" | "other"
  createdAt: Date
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  color: string
  category?: string
  isAllDay?: boolean
  location?: string
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "yearly"
  calendarId: string
  attendees?: string[]
  reminders?: number[]
  metadata?: Record<string, string | number | boolean>
}

interface CalendarContextType {
  currentDate: Date
  setCurrentDate: (date: Date) => void
  view: CalendarView
  setView: (view: CalendarView) => void
  events: CalendarEvent[]
  setEvents: (events: CalendarEvent[]) => void
  selectedEvent: CalendarEvent | null
  setSelectedEvent: (event: CalendarEvent | null) => void
  isEventModalOpen: boolean
  setIsEventModalOpen: (open: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  isTransitioning: boolean
  setIsTransitioning: (transitioning: boolean) => void
  calendars: Calendar[]
  setCalendars: (calendars: Calendar[]) => void
  secondaryCalendars: Calendar[]
  setSecondaryCalendars: (calendars: Calendar[]) => void
  selectedCalendar: Calendar | null
  setSelectedCalendar: (calendar: Calendar | null) => void
  isCalendarModalOpen: boolean
  setIsCalendarModalOpen: (open: boolean) => void
  addCalendar: (calendar: Omit<Calendar, "id" | "createdAt">) => void
  updateCalendar: (id: string, updates: Partial<Calendar>) => void
  deleteCalendar: (id: string) => void
  toggleCalendarVisibility: (id: string) => void
  getVisibleEvents: () => CalendarEvent[]
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("month")

  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [secondaryCalendars, setSecondaryCalendars] = useState<Calendar[]>([])

  const [events, setEvents] = useState<CalendarEvent[]>([])

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const [selectedCalendar, setSelectedCalendar] = useState<Calendar | null>(null)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)

  const addCalendar = (calendarData: Omit<Calendar, "id" | "createdAt">) => {
    const newCalendar: Calendar = {
      ...calendarData,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    setCalendars((prev) => [...prev, newCalendar])
  }

  const updateCalendar = (id: string, updates: Partial<Calendar>) => {
    setCalendars((prev) => prev.map((cal) => (cal.id === id ? { ...cal, ...updates } : cal)))
  }

  const deleteCalendar = (id: string) => {
    const isPrimary = calendars.some((cal) => cal.id === id)
    if (isPrimary) {
      if (calendars.length <= 1 || calendars.find((cal) => cal.id === id)?.isDefault) {
        return
      }
      setCalendars((prev) => prev.filter((cal) => cal.id !== id))
      setEvents((prev) => prev.filter((event) => event.calendarId !== id))
    } else {
      setSecondaryCalendars((prev) => prev.filter((cal) => cal.id !== id))
    }
  }

  const toggleCalendarVisibility = (id: string) => {
    let handled = false
    setCalendars((prev) => {
      if (!prev.some((cal) => cal.id === id)) return prev
      handled = true
      return prev.map((cal) => (cal.id === id ? { ...cal, isVisible: !cal.isVisible } : cal))
    })
    if (!handled) {
      setSecondaryCalendars((prev) =>
        prev.some((cal) => cal.id === id)
          ? prev.map((cal) => (cal.id === id ? { ...cal, isVisible: !cal.isVisible } : cal))
          : prev,
      )
    }
  }

  const getVisibleEvents = () => {
    const visiblePrimaryIds = calendars.filter((cal) => cal.isVisible).map((cal) => cal.id)
    const visibleSecondaryIds = secondaryCalendars.filter((cal) => cal.isVisible).map((cal) => cal.id)

    return events.filter((event) => {
      const primaryVisible =
        visiblePrimaryIds.length === 0 || visiblePrimaryIds.includes(event.calendarId)
      const statusCalendarId =
        typeof event.metadata?.statusCalendarId === "string"
          ? (event.metadata.statusCalendarId as string)
          : undefined
      const secondaryVisible =
        visibleSecondaryIds.length === 0 ||
        !statusCalendarId ||
        visibleSecondaryIds.includes(statusCalendarId)
      return primaryVisible && secondaryVisible
    })
  }

  return (
    <CalendarContext.Provider
      value={{
        currentDate,
        setCurrentDate,
        view,
        setView,
        events,
        setEvents,
        selectedEvent,
        setSelectedEvent,
        isEventModalOpen,
        setIsEventModalOpen,
        sidebarOpen,
        setSidebarOpen,
        isLoading,
        setIsLoading,
        isTransitioning,
        setIsTransitioning,
        calendars,
        setCalendars,
        secondaryCalendars,
        setSecondaryCalendars,
        selectedCalendar,
        setSelectedCalendar,
        isCalendarModalOpen,
        setIsCalendarModalOpen,
        addCalendar,
        updateCalendar,
        deleteCalendar,
        toggleCalendarVisibility,
        getVisibleEvents,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar() {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider")
  }
  return context
}
