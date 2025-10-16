"use client"

import { createContext, useContext, useMemo, type ReactNode, useState } from "react"
import { useCalendar, type CalendarEvent } from "./calendar-context"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isWithinInterval,
  differenceInMinutes,
  getHours,
  subDays,
  subMonths,
  addDays,
} from "date-fns"

export interface AnalyticsData {
  totalEvents: number
  totalHours: number
  averageEventDuration: number
  busiestDay: string
  busiestHour: number
  categoryBreakdown: { category: string; count: number; hours: number; color: string }[]
  weeklyActivity: { day: string; events: number; hours: number }[]
  monthlyTrend: { month: string; events: number; hours: number }[]
  heatmapData: { date: string; value: number }[]
  productivityScore: number
  upcomingBusyDays: { date: string; events: number }[]
  timeDistribution: { hour: number; events: number }[]
}

interface AnalyticsContextType {
  analyticsData: AnalyticsData
  isAnalyticsModalOpen: boolean
  setIsAnalyticsModalOpen: (open: boolean) => void
  getEventsByDateRange: (start: Date, end: Date) => CalendarEvent[]
  calculateProductivityScore: (events: CalendarEvent[]) => number
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { getVisibleEvents, calendars } = useCalendar()
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false)

  const getEventsByDateRange = (start: Date, end: Date): CalendarEvent[] => {
    const events = getVisibleEvents()
    return events.filter(
      (event) => isWithinInterval(event.startDate, { start, end }) || isWithinInterval(event.endDate, { start, end }),
    )
  }

  const calculateProductivityScore = (events: CalendarEvent[]): number => {
    if (events.length === 0) return 0

    const workEvents = events.filter((event) => event.category === "Work" || event.calendarId === "work")
    const totalHours = events.reduce((sum, event) => sum + differenceInMinutes(event.endDate, event.startDate) / 60, 0)
    const workHours = workEvents.reduce(
      (sum, event) => sum + differenceInMinutes(event.endDate, event.startDate) / 60,
      0,
    )

    // Score based on work/life balance and event distribution
    const workLifeBalance = Math.min(workHours / Math.max(totalHours - workHours, 1), 2)
    const eventDistribution = Math.min(events.length / 7, 1) // Ideal: 1 event per day

    return Math.round((workLifeBalance * 0.6 + eventDistribution * 0.4) * 100)
  }

  const analyticsData: AnalyticsData = useMemo(() => {
    const events = getVisibleEvents()
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const recentEvents = getEventsByDateRange(thirtyDaysAgo, now)

    // Basic metrics
    const totalEvents = recentEvents.length
    const totalMinutes = recentEvents.reduce(
      (sum, event) => sum + differenceInMinutes(event.endDate, event.startDate),
      0,
    )
    const totalHours = totalMinutes / 60
    const averageEventDuration = totalEvents > 0 ? totalMinutes / totalEvents : 0

    // Busiest day and hour analysis
    const dayCount: Record<string, number> = {}
    const hourCount: Record<number, number> = {}

    recentEvents.forEach((event) => {
      const dayName = format(event.startDate, "EEEE")
      const hour = getHours(event.startDate)

      dayCount[dayName] = (dayCount[dayName] || 0) + 1
      hourCount[hour] = (hourCount[hour] || 0) + 1
    })

    const busiestDay = Object.entries(dayCount).reduce(
      (a, b) => (dayCount[a[0]] > dayCount[b[0]] ? a : b),
      ["Monday", 0],
    )[0]

    const busiestHour = Object.entries(hourCount).reduce(
      (a, b) => (hourCount[Number.parseInt(a[0])] > hourCount[Number.parseInt(b[0])] ? a : b),
      ["9", 0],
    )[0]

    // Category breakdown
    const categoryStats: Record<string, { count: number; hours: number; color: string }> = {}

    recentEvents.forEach((event) => {
      const category = event.category || "Uncategorized"
      const calendar = calendars.find((cal) => cal.id === event.calendarId)
      const color = calendar?.color || event.color
      const duration = differenceInMinutes(event.endDate, event.startDate) / 60

      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, hours: 0, color }
      }

      categoryStats[category].count += 1
      categoryStats[category].hours += duration
    })

    const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      count: stats.count,
      hours: Math.round(stats.hours * 10) / 10,
      color: stats.color,
    }))

    // Weekly activity
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    const weeklyActivity = weekDays.map((day) => {
      const dayEvents = events.filter((event) => format(event.startDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
      const dayHours = dayEvents.reduce(
        (sum, event) => sum + differenceInMinutes(event.endDate, event.startDate) / 60,
        0,
      )

      return {
        day: format(day, "EEE"),
        events: dayEvents.length,
        hours: Math.round(dayHours * 10) / 10,
      }
    })

    // Monthly trend (last 6 months)
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(subMonths(now, 5 - i))
      const monthEnd = endOfMonth(monthStart)
      const monthEvents = getEventsByDateRange(monthStart, monthEnd)
      const monthHours = monthEvents.reduce(
        (sum, event) => sum + differenceInMinutes(event.endDate, event.startDate) / 60,
        0,
      )

      return {
        month: format(monthStart, "MMM"),
        events: monthEvents.length,
        hours: Math.round(monthHours * 10) / 10,
      }
    })

    // Heatmap data (last 90 days)
    const ninetyDaysAgo = subDays(now, 90)
    const heatmapDays = eachDayOfInterval({ start: ninetyDaysAgo, end: now })

    const heatmapData = heatmapDays.map((day) => {
      const dayEvents = events.filter((event) => format(event.startDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))

      return {
        date: format(day, "yyyy-MM-dd"),
        value: dayEvents.length,
      }
    })

    // Time distribution (24 hours)
    const timeDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      events: recentEvents.filter((event) => getHours(event.startDate) === hour).length,
    }))

    // Upcoming busy days (next 7 days)
    const nextWeek = eachDayOfInterval({
      start: now,
      end: addDays(now, 7),
    })

    const upcomingBusyDays = nextWeek
      .map((day) => {
        const dayEvents = events.filter((event) => format(event.startDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
        return {
          date: format(day, "MMM d"),
          events: dayEvents.length,
        }
      })
      .filter((day) => day.events > 0)
      .sort((a, b) => b.events - a.events)
      .slice(0, 3)

    const productivityScore = calculateProductivityScore(recentEvents)

    return {
      totalEvents,
      totalHours: Math.round(totalHours * 10) / 10,
      averageEventDuration: Math.round(averageEventDuration),
      busiestDay,
      busiestHour: Number.parseInt(busiestHour),
      categoryBreakdown,
      weeklyActivity,
      monthlyTrend,
      heatmapData,
      productivityScore,
      upcomingBusyDays,
      timeDistribution,
    }
  }, [getVisibleEvents, calendars])

  return (
    <AnalyticsContext.Provider
      value={{
        analyticsData,
        isAnalyticsModalOpen,
        setIsAnalyticsModalOpen,
        getEventsByDateRange,
        calculateProductivityScore,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider")
  }
  return context
}
