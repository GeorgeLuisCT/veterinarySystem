"use client"

import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { addDays, addMonths, addWeeks, format, subDays, subMonths, subWeeks } from "date-fns"
import { es } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"
import { useCalendar } from "./calendar-context"

import { HeaderAction } from "@/types/header-calendar-actions"
import type { ComponentType } from "react"

type ViewType = "month" | "week" | "day"

const VIEW_LABELS: Record<ViewType, string> = {
  month: "Mes",
  week: "Semana",
  day: "Día",
}

/** Config del botón principal (derecha) */
export type PrimaryAction = {
  key: string
  label: string
  icon?: ComponentType<{ className?: string }>
  onClick?: () => void
  /** size del botón shadcn: "sm" | "default" | "lg" */
  size?: "sm" | "default" | "lg"
}

export interface CalendarHeaderProps {
  /** Acciones a renderizar en la derecha (antes del botón principal) */
  actions?: HeaderAction[]
  /** Acción principal configurable (texto/ícono) */
  primaryAction?: PrimaryAction
  /** Callback para delegar acciones al padre si la acción no define onClick */
  onAction?: (key: string) => void
  /** Mostrar el switcher de vista (month/week/day). Default: true */
  showViewSwitcher?: boolean
  /** Título (por si quieres reemplazar "Calendar/Cal") */
  titleOverride?: string
}

export function CalendarHeader({

  primaryAction,
  onAction,
  showViewSwitcher = true,
  titleOverride,
}: CalendarHeaderProps) {
  const {
    currentDate,
    setCurrentDate,
    view,
    setView,
    sidebarOpen,
    setSidebarOpen,
    setIsTransitioning,
  } = useCalendar()

  const isMobile = useIsMobile()

  const navigateDate = (direction: "prev" | "next") => {
    setIsTransitioning(true)
    setTimeout(() => {
      if (view === "month") {
        setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
      } else if (view === "week") {
        setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
      } else {
        setCurrentDate(direction === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1))
      }
      setTimeout(() => setIsTransitioning(false), 300)
    }, 100)
  }

  const handleViewChange = (newView: ViewType) => {
    if (newView !== view) {
      setIsTransitioning(true)
      setTimeout(() => {
        setView(newView)
        setTimeout(() => setIsTransitioning(false), 300)
      }, 100)
    }
  }

  const goToToday = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentDate(new Date())
      setTimeout(() => setIsTransitioning(false), 300)
    }, 100)
  }

  const getDateTitle = () => {
    if (view === "month") return format(currentDate, isMobile ? "MMM yyyy" : "MMMM yyyy", { locale: es })
    if (view === "week") return format(currentDate, "MMM yyyy", { locale: es })
    return format(currentDate, isMobile ? "d 'de' MMM" : "EEEE, d 'de' MMMM yyyy", { locale: es })
  }

  /** Dispara una acción: usa su onClick si existe, si no, delega a onAction(key) */
  const trigger = (a: HeaderAction | PrimaryAction) => {
    if ("onClick" in a && typeof a.onClick === "function") {
      a.onClick()
    } else {
      onAction?.(a.key)
    }
  }

  const Title = () => (
    <div className="flex items-center gap-2 md:gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{titleOverride ?? (isMobile ? "Agenda" : "Calendario")}</h1>
      <Button
        variant="outline"
        size="sm"
        onClick={goToToday}
        className={cn(
          "text-xs md:text-sm bg-transparent transition-all duration-200 hover:scale-105 active:scale-95",
          "hover:shadow-sm hover:shadow-blue-500/20",
        )}
      >
        Hoy
      </Button>
    </div>
  )

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Sidebar (propio del layout móvil) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "md:hidden transition-all duration-200 hover:scale-105 active:scale-95",
            "relative overflow-hidden before:absolute before:inset-0 before:bg-blue-500/20 before:rounded-full before:scale-0 hover:before:scale-100 before:transition-transform before:duration-300",
          )}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Title />

        {/* Navegación fecha */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate("prev")}
            className="transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-blue-50 dark:hover:bg-blue-950/50"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate("next")}
            className="transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-blue-50 dark:hover:bg-blue-950/50"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        <h2 className="text-sm md:text-xl font-medium text-foreground min-w-[100px] md:min-w-[200px] transition-all duration-300">
          {getDateTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        {/* Switcher de vista (propio del calendario) */}
        {showViewSwitcher && (
          <div className="hidden md:flex items-center bg-muted rounded-lg p-1 shadow-sm">
            {(["month", "week", "day"] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewChange(v)}
                className={cn(
                  "capitalize transition-all duration-200 relative overflow-hidden",
                  view === v && "shadow-sm bg-blue-600 text-white hover:bg-blue-700",
                  view !== v && "hover:bg-accent hover:scale-105",
                )}
              >
                {VIEW_LABELS[v]}
              </Button>
            ))}
          </div>
        )}

        {/* Acciones: desktop vs móvil */}
        {/*<div className="hidden md:flex items-center gap-1 md:gap-2">
          <DesktopActions />
        </div>
        <div className="md:hidden">
          <MobileMenu />
        </div>*/}

        {/* Botón principal configurable */}
        {primaryAction && (
          <Button
            onClick={() => trigger(primaryAction)}
            className={cn(
              "bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 active:scale-95",
              "shadow-sm hover:shadow-xl hover:shadow-blue-500/25",
              "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
            )}
            size={primaryAction.size ?? (isMobile ? "sm" : "default")}
          >
            {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-1 md:mr-2" />}
            {primaryAction.label}
          </Button>
        )}
      </div>
    </header>
  )
}
