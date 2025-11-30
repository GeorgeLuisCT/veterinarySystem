"use client"

import { useCalendar } from "./calendar-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { format, isSameMonth, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { X, Plus, Settings } from "lucide-react"

interface CalendarSidebarProps {
  primaryTitle?: string
  secondaryTitle?: string
  primaryReadOnly?: boolean
  secondaryReadOnly?: boolean
  showSecondaryCard?: boolean
  showPrimaryCard?: boolean
}

export function CalendarSidebar({
  primaryTitle,
  secondaryTitle,
  primaryReadOnly,
  secondaryReadOnly,
  showSecondaryCard = true,
  showPrimaryCard = true,
}: CalendarSidebarProps) {
  const {
    currentDate,
    setCurrentDate,
    getVisibleEvents,
    sidebarOpen,
    setSidebarOpen,
    calendars,
    secondaryCalendars,
    toggleCalendarVisibility,
    setSelectedCalendar,
    setIsCalendarModalOpen,
  } = useCalendar()
  const isMobile = useIsMobile()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const visibleEvents = getVisibleEvents()

  const getStatusColor = (event: any) => {
    const statusCalendarId = event.metadata?.statusCalendarId
    if (!statusCalendarId) return undefined
    return secondaryCalendars.find((calendar) => calendar.id === statusCalendarId)?.color
  }

  // Eventos de hoy
  const todayEvents = visibleEvents.filter((event) => isSameDay(event.startDate, new Date()))

  // Próximos 7 días
  const upcomingEvents = visibleEvents
    .filter((event) => {
      const today = new Date()
      const weekFromNow = new Date()
      weekFromNow.setDate(today.getDate() + 7)
      return event.startDate >= today && event.startDate <= weekFromNow
    })
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  const derivedPrimaryReadOnly =
    primaryReadOnly ?? (calendars.length > 0 && calendars.every((calendar) => calendar.id.startsWith("type-")))
  const derivedSecondaryReadOnly =
    secondaryReadOnly ??
    (secondaryCalendars.length > 0 && secondaryCalendars.every((calendar) => calendar.id.startsWith("status-")))

  const resolvedPrimaryTitle =
    primaryTitle ?? (derivedPrimaryReadOnly ? "Tipos de cita" : "My Calendars")
  const resolvedSecondaryTitle =
    secondaryTitle ?? (derivedSecondaryReadOnly ? "Estados de cita" : "Calendarios adicionales")

  const handleCreateCalendar = () => {
    setSelectedCalendar(null)
    setIsCalendarModalOpen(true)
  }

  const handleEditCalendar = (calendar: any) => {
    setSelectedCalendar(calendar)
    setIsCalendarModalOpen(true)
  }

  if (!sidebarOpen) return null

  // ⬇️ Evita keys duplicadas en el header de días
  const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "bg-card border-r border-border p-4 overflow-y-auto z-50",
          isMobile
            ? "fixed left-0 top-0 bottom-0 w-80 transform transition-transform duration-300 ease-in-out" +
            (sidebarOpen ? " translate-x-0" : " -translate-x-full")
            : "w-80 relative",
        )}
      >
        {isMobile && (
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Calendario</h3>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {showPrimaryCard && (
          <Card className="p-4 mb-6 gap-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{resolvedPrimaryTitle}</h3>
              {!derivedPrimaryReadOnly && (
                <Button variant="ghost" size="sm" onClick={handleCreateCalendar} className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {calendars.map((calendar) => (
                <div key={calendar.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={calendar.isVisible}
                    onCheckedChange={() => toggleCalendarVisibility(calendar.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: calendar.color }} />
                  <span className="flex-1 text-sm truncate">{calendar.name}</span>
                  {!derivedPrimaryReadOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCalendar(calendar)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {showSecondaryCard && secondaryCalendars.length > 0 && (
          <Card className="p-4 mb-6 gap-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{resolvedSecondaryTitle}</h3>
            </div>
            <div className="space-y-2">
              {secondaryCalendars.map((calendar) => (
                <div key={calendar.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={calendar.isVisible}
                    onCheckedChange={() => toggleCalendarVisibility(calendar.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: calendar.color }} />
                  <span className="flex-1 text-sm truncate">{calendar.name}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Mini Calendar */}
        <Card className="p-4 mb-6">
          <h3 className="font-medium mb-3 text-center">{format(currentDate, "MMMM yyyy", { locale: es })}</h3>

          {/* ✅ Keys únicas por índice estable */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={`wd-${i}`} className="p-1 text-muted-foreground font-medium">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Celdas vacías antes del inicio del mes */}
            {Array.from({ length: getDay(monthStart) }).map((_, index) => (
              <div key={`empty-${index}`} className="p-1" />
            ))}

            {monthDays.map((day) => {
              const hasEvents = visibleEvents.some((event) => isSameDay(event.startDate, day))
              const isToday = isSameDay(day, new Date())
              const isSelected = isSameDay(day, currentDate)

              return (
                <Button
                  key={day.toISOString()}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentDate(day)
                    if (isMobile) setSidebarOpen(false)
                  }}
                  className={cn(
                    "h-8 w-8 p-0 text-xs relative",
                    isToday && "bg-blue-600 text-white hover:bg-blue-700",
                    isSelected && !isToday && "bg-accent",
                    !isSameMonth(day, currentDate) && "text-muted-foreground",
                  )}
                >
                  {format(day, "d")}
                  {hasEvents && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                  )}
                </Button>
              )
            })}
          </div>
        </Card>

        {/* Today's Events */}
        {todayEvents.length > 0 && (
          <Card className="p-4 mb-6">
            <h3 className="font-medium mb-3">Eventos de hoy</h3>
            <div className="space-y-2">
              {todayEvents.map((event) => {
                const eventCalendar =
                  calendars.find((cal) => cal.id === event.calendarId) ??
                  secondaryCalendars.find((cal) => cal.id === event.calendarId)
                const statusColor = getStatusColor(event)
                return (
                  <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color, border: statusColor ? `2px solid ${statusColor}` : undefined }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{format(event.startDate, "HH:mm", { locale: es })}</p>
                        {eventCalendar && (
                          <Badge variant="outline" className="text-xs">
                            {eventCalendar.name}
                          </Badge>
                        )}
                        {statusColor && (
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-border"
                            style={{ backgroundColor: statusColor }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Upcoming Events */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Próximos</h3>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos próximos</p>
            ) : (
              upcomingEvents.slice(0, isMobile ? 5 : 10).map((event) => {
                const eventCalendar =
                  calendars.find((cal) => cal.id === event.calendarId) ??
                  secondaryCalendars.find((cal) => cal.id === event.calendarId)
                const statusColor = getStatusColor(event)
                return (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: event.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{format(event.startDate, "d MMM HH:mm", { locale: es })}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {event.category && (
                          <Badge variant="secondary" className="text-xs">
                            {event.category}
                          </Badge>
                        )}
                        {eventCalendar && (
                          <Badge variant="outline" className="text-xs">
                            {eventCalendar.name}
                          </Badge>
                        )}
                        {statusColor && (
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-border"
                            style={{ backgroundColor: statusColor }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </aside>
    </>
  )
}
