"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useCalendar } from "../calendar-context"
import { format, isSameDay, isToday, setHours, setMinutes, getHours, getMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

const HOURS = Array.from({ length: 24 }, (_, i) => i) // 24-hour format
const HOUR_HEIGHT = 80 // pixels per hour
const SLOT_HEIGHT = HOUR_HEIGHT / 2 // 30-minute slots

export function DayView() {
  const { currentDate, events, setSelectedEvent, setIsEventModalOpen, setCurrentDate, secondaryCalendars } =
    useCalendar()
  const [currentTime, setCurrentTime] = useState(new Date())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current && isToday(currentDate)) {
      const currentHour = getHours(currentTime)
      const scrollTop = Math.max(0, currentHour * HOUR_HEIGHT - 200)
      scrollContainerRef.current.scrollTop = scrollTop
    }
  }, [currentDate])

  const getEventsForDay = () => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      return (eventStart <= dayEnd && eventEnd >= dayStart) || isSameDay(eventStart, currentDate)
    })
  }

  const getAllDayEvents = () => {
    return getEventsForDay().filter((event) => event.isAllDay)
  }

  const getTimedEvents = () => {
    return getEventsForDay().filter((event) => !event.isAllDay)
  }

  const getStatusColor = (event: any) => {
    const statusCalendarId = event.metadata?.statusCalendarId
    if (!statusCalendarId) return undefined
    return secondaryCalendars.find((calendar) => calendar.id === statusCalendarId)?.color
  }

  const getEventPosition = (event: any) => {
    const startHour = getHours(event.startDate)
    const startMinute = getMinutes(event.startDate)
    const endHour = getHours(event.endDate)
    const endMinute = getMinutes(event.endDate)

    const top = startHour * HOUR_HEIGHT + (startMinute / 60) * HOUR_HEIGHT
    const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) * (HOUR_HEIGHT / 60)

    return { top, height: Math.max(30, height) }
  }

  const handleTimeSlotClick = (hour: number, isHalfHour = false) => {
    const minutes = isHalfHour ? 30 : 0
    const clickedDate = setHours(setMinutes(new Date(currentDate), minutes), hour)
    setCurrentDate(clickedDate)
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const getCurrentTimePosition = () => {
    if (!isToday(currentDate)) return null

    const hour = getHours(currentTime)
    const minute = getMinutes(currentTime)
    return hour * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT
  }

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
  }

  const currentTimePosition = getCurrentTimePosition()
  const allDayEvents = getAllDayEvents()
  const timedEvents = getTimedEvents()

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Day header */}
      <div className="border-b border-border bg-card">
        {/* Navigation */}
        {/* <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigateDay("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigateDay("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-4">
              <h2 className="text-lg font-semibold">{format(currentDate, "EEEE", { locale: es })}</h2>
              <p className="text-sm text-muted-foreground">
                {format(currentDate, "d 'de' MMMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setSelectedEvent(null)
              setIsEventModalOpen(true)
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva cita
          </Button>
        </div>*/}

        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="p-4 border-b border-border">
            <div className="text-xs text-muted-foreground font-medium mb-2">Todo el día</div>
            <div className="space-y-1">
              {allDayEvents.map((event) => {
                const statusColor = getStatusColor(event)
                return (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className="text-sm p-2 rounded text-white cursor-pointer hover:opacity-80 font-medium"
                    style={{
                      backgroundColor: event.color,
                      borderLeft: statusColor ? `4px solid ${statusColor}` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{event.title}</span>
                      <div className="flex items-center gap-1">
                        {event.location && <span className="text-xs opacity-90 truncate">{event.location}</span>}
                        {statusColor && (
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-white/70 flex-shrink-0"
                            style={{ backgroundColor: statusColor }}
                          />
                        )}
                      </div>
                    </div>
                    {event.description && <div className="text-xs opacity-90 mt-1">{event.description}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-hidden">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto">
          <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
            <div className="flex">
              {/* Time column */}
              <div className="w-20 border-r border-border flex-shrink-0">
                {HOURS.map((hour) => (
                  <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                    <div className="absolute -top-2 left-2 text-sm text-muted-foreground font-medium">
                      {format(setHours(new Date(), hour), "HH:mm", { locale: es })}
                    </div>
                    {/* Half-hour line */}
                    <div className="absolute left-4 right-0 border-t border-border/50" style={{ top: SLOT_HEIGHT }} />
                  </div>
                ))}
              </div>

              {/* Day column */}
              <div className="flex-1 relative">
                {/* Hour slots */}
                {HOURS.map((hour) => (
                  <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                    {/* Full hour slot */}
                    <div
                      className="absolute inset-x-0 cursor-pointer hover:bg-accent/20 transition-colors border-b border-border"
                      style={{ height: SLOT_HEIGHT }}
                      onClick={() => handleTimeSlotClick(hour, false)}
                    />
                    {/* Half hour slot */}
                    <div
                      className="absolute inset-x-0 cursor-pointer hover:bg-accent/20 transition-colors"
                      style={{ top: SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      onClick={() => handleTimeSlotClick(hour, true)}
                    />
                  </div>
                ))}

                {/* Events */}
                {timedEvents.map((event) => {
                  const { top, height } = getEventPosition(event)
                  const statusColor = getStatusColor(event)
                  return (
                    <div
                      key={event.id}
                      className="absolute left-2 right-2 rounded text-white cursor-pointer hover:opacity-80 transition-opacity z-10 shadow-sm"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: event.color,
                        borderLeft: statusColor ? `4px solid ${statusColor}` : undefined,
                      }}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <div className="p-2 h-full flex flex-col">
                        <div className="font-medium text-sm truncate flex items-center gap-1">
                          <span className="truncate">{event.title}</span>
                          {statusColor && (
                            <span
                              className="h-2 w-2 rounded-full border border-white/70 flex-shrink-0"
                              style={{ backgroundColor: statusColor }}
                            />
                          )}
                        </div>
                        <div className="text-xs opacity-90">
                          {event.title + " "}  ({format(event.startDate, "HH:mm", { locale: es })} -
                          {" "}
                          {format(event.endDate, "HH:mm", { locale: es })})
                        </div>
                        {event.location && <div className="text-xs opacity-80 truncate mt-1">{event.location}</div>}
                        {event.description && height > 60 && (
                          <div className="text-xs opacity-80 mt-1 flex-1 overflow-hidden">{event.description}</div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Current time indicator */}
                {currentTimePosition !== null && (
                  <div className="absolute left-0 right-0 z-20" style={{ top: `${currentTimePosition}px` }}>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 border-2 border-white shadow-sm"></div>
                      <div className="flex-1 h-0.5 bg-red-500"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="border-t border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        {timedEvents.length + allDayEvents.length} events • Click on time slots to create new events
      </div>
    </div>
  )
}
