"use client"

import type React from "react"
import { useState } from "react"
import { useCalendar } from "../calendar-context"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  getDay,
  addDays,
  subDays,
  isToday,
} from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"

export function MonthView() {
  const {
    currentDate,
    getVisibleEvents,
    setSelectedEvent,
    setIsEventModalOpen,
    setCurrentDate,
    secondaryCalendars,
  } = useCalendar()
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const isMobile = useIsMobile()

  const visibleEvents = getVisibleEvents()

  const getStatusColor = (event: any) => {
    const statusCalendarId = event.metadata?.statusCalendarId
    if (!statusCalendarId) return undefined
    return secondaryCalendars.find((calendar) => calendar.id === statusCalendarId)?.color
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  const calendarStart = subDays(monthStart, getDay(monthStart))
  const calendarEnd = addDays(monthEnd, 6 - getDay(monthEnd))

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (day: Date) => {
    return visibleEvents
      .filter((event) => {
        const eventStart = new Date(event.startDate)
        const eventEnd = new Date(event.endDate)
        const dayStart = new Date(day)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(23, 59, 59, 999)

        return (eventStart <= dayEnd && eventEnd >= dayStart) || isSameDay(eventStart, day) || isSameDay(eventEnd, day)
      })
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1
        if (!a.isAllDay && b.isAllDay) return 1
        return a.startDate.getTime() - b.startDate.getTime()
      })
  }

  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const handleDateClick = (day: Date) => {
    setCurrentDate(day)
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const handleQuickAdd = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentDate(day)
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const EventItem = ({ event, isCompact = false }: { event: any; isCompact?: boolean }) => {
    const eventStart = new Date(event.startDate)
    const eventEnd = new Date(event.endDate)
    const durationMinutes = Math.round((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60))
    const statusColor = getStatusColor(event)

    return (
      <div
        onClick={(e) => handleEventClick(event, e)}
        className={cn(
          "text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate text-white font-medium",
          isCompact ? "py-0.5" : "py-1",
          isMobile && "min-h-[24px] flex items-center",
        )}
        style={{ backgroundColor: event.color }}
        title={`${event.title} - ${format(eventStart, "HH:mm", { locale: es })}${
          durationMinutes > 0 ? ` (${durationMinutes} min)` : ""
        }`}
      >
        <div className="flex items-center gap-1">
          {event.isAllDay ? (
            <span className="truncate">{event.title}</span>
          ) : (
            <>
              {!isMobile && (
                <span className="text-[10px] opacity-90 flex-shrink-0">
                  {format(eventStart, "HH:mm", { locale: es })}
                </span>
              )}
              <span className="truncate">{event.title}</span>
            </>
          )}
          {statusColor && (
            <span
              className="ml-1 h-2.5 w-2.5 rounded-full border border-white/60 flex-shrink-0"
              style={{ backgroundColor: statusColor }}
            />
          )}
        </div>
      </div>
    )
  }

  const DayMoreEvents = ({ day, events }: { day: Date; events: any[] }) => {
    const visibleEvents = events.slice(0, isMobile ? 2 : 3)
    const hiddenEvents = events.slice(isMobile ? 2 : 3)

    if (hiddenEvents.length === 0) return null

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-full text-xs text-muted-foreground hover:bg-accent p-0 justify-start"
          >
            <MoreHorizontal className="h-3 w-3 mr-1" />+{hiddenEvents.length} más
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-1">
            <div className="font-medium text-sm mb-2">
              {format(day, "EEEE d 'de' MMMM", { locale: es })}
            </div>
            {events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className={cn("h-full flex flex-col bg-background", isMobile && "pb-20")}>
      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 sticky top-0 z-10">
        {["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((day, index) => (
          <div
            key={day}
            className={cn(
              "p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-foreground",
              index === 0 || index === 6 ? "text-muted-foreground" : "", // Weekend styling
            )}
          >
            <div className="hidden sm:block">{day}</div>
            <div className="sm:hidden">{day.slice(0, 1)}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr min-h-0">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDate = isToday(day)
          const isWeekend = index % 7 === 0 || index % 7 === 6
          const isHovered = hoveredDate && isSameDay(hoveredDate, day)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r border-b border-border p-1 md:p-2 relative group cursor-pointer transition-all duration-200",
                "hover:bg-accent/30 hover:shadow-sm",
                isMobile ? "min-h-[80px]" : "min-h-[120px]",
                !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                isCurrentMonth && "bg-card",
                isTodayDate && "bg-blue-50 dark:bg-blue-950/20",
                isWeekend && isCurrentMonth && "bg-muted/5",
                index % 7 === 6 && "border-r-0", // Remove right border on last column
                isHovered && "ring-1 ring-blue-200 dark:ring-blue-800",
              )}
              onClick={() => handleDateClick(day)}
              onMouseEnter={() => !isMobile && setHoveredDate(day)}
              onMouseLeave={() => !isMobile && setHoveredDate(null)}
            >
              {/* Date number and quick add button */}
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <span
                  className={cn(
                    "text-xs md:text-sm font-medium transition-colors",
                    isTodayDate &&
                      "bg-blue-600 text-white rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-xs font-semibold shadow-sm",
                    !isTodayDate && isCurrentMonth && "text-foreground",
                    !isTodayDate && !isCurrentMonth && "text-muted-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* Quick add button - shows on hover for desktop, always visible on mobile */}
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-5 w-5 md:h-6 md:w-6 p-0 transition-opacity",
                    "hover:bg-blue-100 dark:hover:bg-blue-900/50",
                    isMobile ? "opacity-60" : "opacity-0 group-hover:opacity-100",
                  )}
                  onClick={(e) => handleQuickAdd(day, e)}
                >
                  <Plus className="h-2 w-2 md:h-3 md:w-3" />
                </Button>
              </div>

              {/* Events container */}
              <div className="space-y-1 overflow-hidden">
                {dayEvents.slice(0, isMobile ? 2 : 3).map((event, eventIndex) => (
                  <EventItem key={`${event.id}-${eventIndex}`} event={event} />
                ))}

                {/* More events indicator */}
                <DayMoreEvents day={day} events={dayEvents} />
              </div>

              {/* Event count indicator for mobile */}
              {dayEvents.length > 0 && isMobile && (
                <div className="absolute top-1 right-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                </div>
              )}

              {/* Today indicator ring */}
              {isTodayDate && (
                <div className="absolute inset-0 border-2 border-blue-200 dark:border-blue-800 rounded-lg pointer-events-none opacity-50"></div>
              )}
            </div>
          )
        })}
      </div>

      {/* Month navigation hint - hidden on mobile */}
      {!isMobile && (
        <div className="border-t border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground text-center">
          Haz clic en cualquier fecha para crear una cita • Usa el botón + para un registro rápido
        </div>
      )}
    </div>
  )
}
