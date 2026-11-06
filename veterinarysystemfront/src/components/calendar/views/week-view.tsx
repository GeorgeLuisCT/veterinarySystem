"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  getHours,
  getMinutes,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  startOfWeek,
} from "date-fns"
import { es } from "date-fns/locale"
import { useEffect, useRef, useState } from "react"
import { useCalendar, type CalendarEvent } from "../calendar-context"

const HOURS = Array.from({ length: 24 }, (_, i) => i) // 24-hour format
const HOUR_HEIGHT = 60 // pixels per hour

export function WeekView() {
  const { currentDate, events, setSelectedEvent, setIsEventModalOpen, setCurrentDate, secondaryCalendars } =
    useCalendar()
  const [currentTime, setCurrentTime] = useState(new Date())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = getHours(currentTime)
      const scrollTop = Math.max(0, currentHour * HOUR_HEIGHT - 100)
      scrollContainerRef.current.scrollTop = scrollTop
    }
  }, [])

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      return (eventStart <= dayEnd && eventEnd >= dayStart) || isSameDay(eventStart, day)
    })
  }

  const getAllDayEvents = (day: Date) => {
    return getEventsForDay(day).filter((event) => event.isAllDay)
  }

  const getTimedEvents = (day: Date) => {
    return getEventsForDay(day).filter((event) => !event.isAllDay)
  }

  const getStatusColor = (event: CalendarEvent) => {
    const statusCalendarId = event.metadata?.statusCalendarId
    if (!statusCalendarId) return undefined
    return secondaryCalendars.find((calendar) => calendar.id === statusCalendarId)?.color
  }

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = getHours(event.startDate)
    const startMinute = getMinutes(event.startDate)
    const endHour = getHours(event.endDate)
    const endMinute = getMinutes(event.endDate)

    const top = startHour * HOUR_HEIGHT + (startMinute / 60) * HOUR_HEIGHT
    const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) * (HOUR_HEIGHT / 60)

    return { top: Math.max(0, top), height: Math.max(20, height) }
  }

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const clickedDate = setHours(setMinutes(day, 0), hour)
    setCurrentDate(clickedDate)
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const getCurrentTimePosition = () => {
    const hour = getHours(currentTime)
    const minute = getMinutes(currentTime)
    return hour * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT
  }

  const currentTimePosition = getCurrentTimePosition()

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Week header */}
      <div className="border-b border-border bg-card">
        {/* All-day events section */}
        <div className="grid grid-cols-8 border-b border-border">
          <div className="p-2 text-xs text-muted-foreground font-medium border-r border-border">Todo el día</div>
          {weekDays.map((day) => {
            const allDayEvents = getAllDayEvents(day)
            return (
              <div key={day.toISOString()} className="p-2 min-h-[60px] border-r border-border last:border-r-0">
                <div className="space-y-1">
                  {allDayEvents.map((event) => {
                    const statusColor = getStatusColor(event)
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className="text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 truncate font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: event.color,
                          borderLeft: statusColor ? `4px solid ${statusColor}` : undefined,
                        }}
                        title={event.title}
                      >
                        <span className="truncate">{event.title}</span>
                        {statusColor && (
                          <span
                            className="h-2 w-2 rounded-full border border-white/70 flex-shrink-0"
                            style={{ backgroundColor: statusColor }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-8">
          <div className="p-3 border-r border-border"></div>
          {weekDays.map((day) => {
            const isTodayDate = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-3 text-center border-r border-border last:border-r-0",
                  isTodayDate && "bg-primary/10",
                )}
              >
                <div className="text-xs text-muted-foreground font-medium">
                  {format(day, "EEE", { locale: es })}
                </div>
                <div
                  className={cn(
                    "text-lg font-semibold mt-1",
                    isTodayDate &&
                    "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto",
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-hidden">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto">
          <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
            {/* Time labels and grid */}
            <div className="grid grid-cols-8 h-full">
              {/* Time column */}
              <div className="border-r border-border">
                {HOURS.map((hour) => {
                  const labelTime = setMinutes(setHours(new Date(), hour), 0)
                  return (
                    <div key={hour} className="relative border-b border-border" style={{ height: HOUR_HEIGHT }}>
                      <div className="absolute -top-2 left-2 text-xs text-muted-foreground font-medium">
                        {format(labelTime, "HH:mm", { locale: es })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Day columns */}
              {weekDays.map((day) => {
                const timedEvents = getTimedEvents(day)
                return (
                  <div
                    key={day.toISOString()}
                    className="relative border-r border-border last:border-r-0 hover:bg-accent/20 transition-colors"
                  >
                    {/* Hour slots */}
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="border-b border-border cursor-pointer hover:bg-accent/30 transition-colors"
                        style={{ height: HOUR_HEIGHT }}
                        onClick={() => handleTimeSlotClick(day, hour)}
                      />
                    ))}

                    {/* Events */}
                    {timedEvents.map((event) => {
                      const { top, height } = getEventPosition(event)
                      const statusColor = getStatusColor(event)
                      return (
                        <div
                          key={event.id}
                          className="absolute left-1 right-1 rounded text-white cursor-pointer hover:opacity-80 transition-opacity z-10"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: event.color,
                            borderLeft: statusColor ? `4px solid ${statusColor}` : undefined,
                          }}
                          onClick={(e) => handleEventClick(event, e)}
                        >
                          <div className="p-1 text-xs font-medium">
                            <div className="flex items-center gap-1 truncate">
                              <span className="truncate">{event.title}</span>
                              {statusColor && (
                                <span
                                  className="h-2 w-2 rounded-full border border-white/70 flex-shrink-0"
                                  style={{ backgroundColor: statusColor }}
                                />
                              )}
                            </div>
                            <div className="text-[10px] opacity-90">
                              {format(event.startDate, "HH:mm", { locale: es })} -
                              {" "}
                              {format(event.endDate, "HH:mm", { locale: es })}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Current time indicator */}
                    {isToday(day) && currentTimePosition !== null && (
                      <div className="absolute left-0 right-0 z-20" style={{ top: `${currentTimePosition}px` }}>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
                          <div className="flex-1 h-0.5 bg-red-500"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
