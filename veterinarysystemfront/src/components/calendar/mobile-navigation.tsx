"use client"

import { useCalendar } from "./calendar-context"
import { Button } from "@/components/ui/button"
import { Search, Plus, Settings, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { SearchModal } from "./search-modal"
import { SettingsModal } from "./settings-modal"
import { FilterModal } from "./filter-modal"

export function MobileNavigation() {
  const { view, setView, setIsEventModalOpen, setSelectedEvent } = useCalendar()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
        <div className="flex items-center justify-around py-2 px-4 safe-area-pb">
          {/* View Switcher */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(["month", "week", "day"] as const).map((viewType) => (
              <Button
                key={viewType}
                variant={view === viewType ? "default" : "ghost"}
                size="sm"
                onClick={() => setView(viewType)}
                className={cn(
                  "capitalize text-xs px-2 py-1 h-8",
                  view === viewType && "bg-primary text-primary-foreground",
                )}
              >
                {viewType === "month" ? "M" : viewType === "week" ? "W" : "D"}
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center gap-1 h-12 px-3"
          >
            <Search className="h-4 w-4" />
            <span className="text-xs">Search</span>
          </Button>

          <Button
            onClick={() => {
              setSelectedEvent(null)
              setIsEventModalOpen(true)
            }}
            size="sm"
            className="flex flex-col items-center gap-1 h-12 px-3 bg-primary text-primary-foreground hover:bg-primary/90 text-white rounded-full"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs">Add</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFilterOpen(true)}
            className="flex flex-col items-center gap-1 h-12 px-3"
          >
            <Filter className="h-4 w-4" />
            <span className="text-xs">Filter</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center gap-1 h-12 px-3"
          >
            <Settings className="h-4 w-4" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </>
  )
}
