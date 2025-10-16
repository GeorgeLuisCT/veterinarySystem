"use client"

import { useState, useMemo } from "react"
import { useCalendar } from "./calendar-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, MapPin, Tag, Clock } from "lucide-react"
import { format } from "date-fns"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { events, setCurrentDate, setView, setSelectedEvent, setIsEventModalOpen } = useCalendar()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const cats = new Set(events.map((event) => event.category).filter(Boolean))
    return Array.from(cats)
  }, [events])

  const filteredEvents = useMemo(() => {
    let filtered = events

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query),
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    return filtered.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }, [events, searchQuery, selectedCategory])

  const handleEventClick = (event: any) => {
    setCurrentDate(event.startDate)
    setView("day")
    setSelectedEvent(event)
    setIsEventModalOpen(true)
    onClose()
  }

  const handleClose = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Events
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by title, description, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Filter by category:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery || selectedCategory
                  ? "No events found matching your criteria"
                  : "Start typing to search events"}
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
                </p>
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-2"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{event.title}</h3>

                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(event.startDate, "MMM d, yyyy")}
                          </div>

                          {!event.isAllDay && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(event.startDate, "h:mm a")}
                            </div>
                          )}

                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          {event.category && (
                            <Badge variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {event.category}
                            </Badge>
                          )}
                          {event.isAllDay && (
                            <Badge variant="outline" className="text-xs">
                              All day
                            </Badge>
                          )}
                          {event.recurrence && event.recurrence !== "none" && (
                            <Badge variant="outline" className="text-xs">
                              Repeats {event.recurrence}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
