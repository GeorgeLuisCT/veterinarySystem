"use client"

import { useState } from "react"
import { useCalendar } from "./calendar-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Filter, Calendar, Tag, Clock } from "lucide-react"

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const { events } = useCalendar()
  const [showWork, setShowWork] = useState(true)
  const [showPersonal, setShowPersonal] = useState(true)
  const [showHealth, setShowHealth] = useState(true)
  const [showAllDay, setShowAllDay] = useState(true)
  const [showRecurring, setShowRecurring] = useState(true)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Get unique categories from events
  const categories = Array.from(new Set(events.map((event) => event.category).filter(Boolean)))

  // Get event statistics
  const totalEvents = events.length
  const allDayEvents = events.filter((event) => event.isAllDay).length
  const recurringEvents = events.filter((event) => event.recurrence && event.recurrence !== "none").length
  const eventsWithLocation = events.filter((event) => event.location).length

  const handleReset = () => {
    setShowWork(true)
    setShowPersonal(true)
    setShowHealth(true)
    setShowAllDay(true)
    setShowRecurring(true)
    setDateFrom("")
    setDateTo("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Events
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Calendar Statistics */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar Statistics
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalEvents}</div>
                <div className="text-xs text-muted-foreground">Total Events</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold text-green-600">{allDayEvents}</div>
                <div className="text-xs text-muted-foreground">All-day Events</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold text-purple-600">{recurringEvents}</div>
                <div className="text-xs text-muted-foreground">Recurring</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold text-orange-600">{eventsWithLocation}</div>
                <div className="text-xs text-muted-foreground">With Location</div>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date-from" className="text-xs">
                  From
                </Label>
                <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date-to" className="text-xs">
                  To
                </Label>
                <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categories
              </Label>
              <div className="space-y-2">
                {categories.map((category) => {
                  const categoryEvents = events.filter((event) => event.category === category)
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`category-${category}`}
                          checked={category === "Work" ? showWork : category === "Personal" ? showPersonal : showHealth}
                          onCheckedChange={(checked) => {
                            if (category === "Work") setShowWork(checked)
                            else if (category === "Personal") setShowPersonal(checked)
                            else setShowHealth(checked)
                          }}
                        />
                        <Label htmlFor={`category-${category}`} className="text-sm">
                          {category}
                        </Label>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {categoryEvents.length}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Event Type Filters */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Event Types
            </Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch id="all-day" checked={showAllDay} onCheckedChange={setShowAllDay} />
                  <Label htmlFor="all-day" className="text-sm">
                    All-day events
                  </Label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {allDayEvents}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch id="recurring" checked={showRecurring} onCheckedChange={setShowRecurring} />
                  <Label htmlFor="recurring" className="text-sm">
                    Recurring events
                  </Label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {recurringEvents}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-3">
            <Label>Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                This Week
              </Button>
              <Button variant="outline" size="sm">
                This Month
              </Button>
              <Button variant="outline" size="sm">
                Upcoming
              </Button>
              <Button variant="outline" size="sm">
                Past Events
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset Filters
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>Apply Filters</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
