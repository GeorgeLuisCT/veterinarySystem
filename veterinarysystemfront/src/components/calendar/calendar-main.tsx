"use client"

import { useCalendar } from "./calendar-context"
import { MonthView } from "./views/month-view"
import { WeekView } from "./views/week-view"
import { DayView } from "./views/day-view"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function CalendarMain() {
  const { view, isLoading, isTransitioning } = useCalendar()
  const [currentView, setCurrentView] = useState(view)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (view !== currentView) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentView(view)
        setTimeout(() => setIsAnimating(false), 150)
      }, 150)
    }
  }, [view, currentView])

  const renderView = () => {
    switch (currentView) {
      case "month":
        return <MonthView />
      case "week":
        return <WeekView />
      case "day":
        return <DayView />
      default:
        return <MonthView />
    }
  }

  return (
    <main className="flex-1 bg-background overflow-hidden relative">
      {(isLoading || isTransitioning) && (
        <div className="absolute inset-0 bg-background/80 z-50 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando…</span>
          </div>
        </div>
      )}

      <div
        className={cn(
          "h-full transition-all duration-300 ease-in-out",
          isAnimating && "opacity-0 scale-95",
          !isAnimating && "opacity-100 scale-100",
        )}
      >
        {renderView()}
      </div>
    </main>
  )
}
