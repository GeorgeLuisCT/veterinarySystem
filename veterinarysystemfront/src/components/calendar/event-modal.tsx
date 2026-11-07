"use client"

import { useState, useEffect } from "react"
import { useCalendar, type CalendarEvent } from "./calendar-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Bell, Repeat, Trash2, Copy, Save, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const eventColors = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Teal", value: "#14B8A6" },
]

const eventCategories = [
  { name: "Work", color: "#3B82F6" },
  { name: "Personal", color: "#10B981" },
  { name: "Health", color: "#EF4444" },
  { name: "Travel", color: "#8B5CF6" },
  { name: "Education", color: "#F59E0B" },
  { name: "Social", color: "#EC4899" },
]

const reminderOptions = [
  { label: "None", value: "none" },
  { label: "At time of event", value: "0" },
  { label: "5 minutes before", value: "5" },
  { label: "15 minutes before", value: "15" },
  { label: "30 minutes before", value: "30" },
  { label: "1 hour before", value: "60" },
  { label: "1 day before", value: "1440" },
]

const recurrenceOptions = [
  { label: "Does not repeat", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
]

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EventModal({ isOpen, onClose }: EventModalProps) {
  const {
    selectedEvent,
    setSelectedEvent,
    events,
    setEvents,
    calendars,
  } = useCalendar()

  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isAllDay, setIsAllDay] = useState(false)
  const [color, setColor] = useState("#3B82F6")
  const [category, setCategory] = useState("")
  const [attendees, setAttendees] = useState("")
  const [reminder, setReminder] = useState("15")
  const [recurrence, setRecurrence] = useState("none")
  const [selectedCalendarId, setSelectedCalendarId] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load event data when editing
  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title)
      setDescription(selectedEvent.description || "")
      setLocation(selectedEvent.location || "")
      setStartDate(format(selectedEvent.startDate, "yyyy-MM-dd"))
      setStartTime(format(selectedEvent.startDate, "HH:mm"))
      setEndDate(format(selectedEvent.endDate, "yyyy-MM-dd"))
      setEndTime(format(selectedEvent.endDate, "HH:mm"))
      setIsAllDay(selectedEvent.isAllDay || false)
      setColor(selectedEvent.color)
      setCategory(selectedEvent.category || "")
      setRecurrence(selectedEvent.recurrence || "none")
      setSelectedCalendarId(selectedEvent.calendarId || "")
    } else {
      const defaultCalendar = calendars.find((cal) => cal.isDefault) || calendars[0]
      if (defaultCalendar) {
        setSelectedCalendarId(defaultCalendar.id)
        setColor(defaultCalendar.color)
      }
    }
  }, [selectedEvent, calendars])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setLocation("")
    setStartDate("")
    setStartTime("")
    setEndDate("")
    setEndTime("")
    setIsAllDay(false)
    setColor("#3B82F6")
    setCategory("")
    setAttendees("")
    setReminder("15")
    setRecurrence("none")
    setSelectedCalendarId("")
    setErrors({})
    setShowSuccess(false)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "Event title is required"
    }

    if (!selectedCalendarId) {
      newErrors.calendar = "Please select a calendar"
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required"
    }

    if (!isAllDay && !startTime) {
      newErrors.startTime = "Start time is required"
    }

    if (!isAllDay && !endTime) {
      newErrors.endTime = "End time is required"
    }

    if (!isAllDay && startDate && endDate && startTime && endTime) {
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = new Date(`${endDate || startDate}T${endTime}`)

      if (endDateTime <= startDateTime) {
        newErrors.endTime = "End time must be after start time"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleClose = () => {
    onClose()
    setSelectedEvent(null)
    resetForm()
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 800))

    const startDateTime = isAllDay ? new Date(`${startDate}T00:00:00`) : new Date(`${startDate}T${startTime}`)

    const endDateTime = isAllDay
      ? new Date(`${endDate || startDate}T23:59:59`)
      : new Date(`${endDate || startDate}T${endTime}`)

    const newEvent = {
      id: selectedEvent?.id || Date.now().toString(),
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startDate: startDateTime,
      endDate: endDateTime,
      color,
      category: category || undefined,
      isAllDay,
      recurrence: recurrence as CalendarEvent["recurrence"],
      calendarId: selectedCalendarId,
    }

    if (selectedEvent) {
      setEvents(events.map((event) => (event.id === selectedEvent.id ? newEvent : event)))
    } else {
      setEvents([...events, newEvent])
    }

    setIsLoading(false)
    setShowSuccess(true)

    setTimeout(() => {
      handleClose()
    }, 1200)
  }

  const handleDelete = async () => {
    if (selectedEvent && window.confirm("Are you sure you want to delete this event?")) {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setEvents(events.filter((event) => event.id !== selectedEvent.id))
      setIsLoading(false)
      handleClose()
    }
  }

  const handleDuplicate = () => {
    if (selectedEvent) {
      const duplicatedEvent = {
        ...selectedEvent,
        id: Date.now().toString(),
        title: `${selectedEvent.title} (Copy)`,
      }
      setEvents([...events, duplicatedEvent])
      handleClose()
    }
  }



  const handleCalendarChange = (calendarId: string) => {
    setSelectedCalendarId(calendarId)
    const selectedCal = calendars.find((cal) => cal.id === calendarId)
    if (selectedCal) {
      setColor(selectedCal.color)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-[600px] max-h-[90vh] overflow-y-auto transition-all duration-300",
          "animate-in slide-in-from-bottom-4 fade-in-0",
        )}
      >
        {showSuccess && (
          <div className="absolute inset-0 bg-green-50 dark:bg-green-950/20 rounded-lg flex items-center justify-center z-50 animate-in fade-in-0 duration-300">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto animate-in zoom-in-50 duration-500">
                <Sparkles className="w-8 h-8 text-success-strong animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-success-strong dark:text-green-200">
                  {selectedEvent ? "Event Updated!" : "Event Created!"}
                </h3>
                <p className="text-sm text-success-strong dark:text-green-300">Your event has been saved successfully</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && !showSuccess && (
          <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center z-40">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">
                {selectedEvent ? "Updating event..." : "Creating event..."}
              </span>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-info-strong" />
            {selectedEvent ? "Edit Event" : "Create New Event"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger
              value="details"
              className="transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Event Details
            </TabsTrigger>
            <TabsTrigger
              value="options"
              className="transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Options
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4 animate-in slide-in-from-left-2 duration-300">
            <div className="space-y-2">
              <Label htmlFor="calendar">Calendar *</Label>
              <Select value={selectedCalendarId} onValueChange={handleCalendarChange}>
                <SelectTrigger className={cn(errors.calendar && "border-red-500")}>
                  <SelectValue placeholder="Select a calendar" />
                </SelectTrigger>
                <SelectContent>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: calendar.color }} />
                        <span>{calendar.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {calendar.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.calendar && (
                <p className="text-sm text-red-500 animate-in slide-in-from-left-1 duration-200">{errors.calendar}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                className={cn(
                  "transition-all duration-200 focus:ring-2",
                  errors.title && "border-red-500 focus:ring-red-500/20",
                )}
              />
              {errors.title && (
                <p className="text-sm text-red-500 animate-in slide-in-from-left-1 duration-200">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter event description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location (optional)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="all-day" checked={isAllDay} onCheckedChange={setIsAllDay} />
              <Label htmlFor="all-day">All day event</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={cn(errors.startDate && "border-red-500")}
                />
                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
              </div>
              {!isAllDay && (
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time *</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={cn(errors.startTime && "border-red-500")}
                  />
                  {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              {!isAllDay && (
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time *</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={cn(errors.endTime && "border-red-500")}
                  />
                  {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {eventCategories.map((cat) => (
                  <Badge
                    key={cat.name}
                    variant={category === cat.name ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      category === cat.name && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
                    )}
                    onClick={() => {
                      setCategory(category === cat.name ? "" : cat.name)
                      setColor(cat.color)
                    }}
                  >
                    <div className="w-2 h-2 rounded-full mr-1 animate-pulse" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {eventColors.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setColor(colorOption.value)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all duration-200",
                      "relative overflow-hidden",
                      color === colorOption.value
                        ? "border-foreground scale-110 shadow-sm"
                        : "border-transparent hover:shadow-sm",
                    )}
                    style={{ backgroundColor: colorOption.value }}
                    title={colorOption.name}
                  >
                    {color === colorOption.value && (
                      <div className="absolute inset-0 bg-background animate-pulse rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4 mt-4 animate-in slide-in-from-right-2 duration-300">
            <div className="space-y-2">
              <Label htmlFor="attendees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendees
              </Label>
              <Input
                id="attendees"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="Enter email addresses separated by commas"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Reminder
              </Label>
              <Select value={reminder} onValueChange={setReminder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Repeat
              </Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEvent && (
              <div className="space-y-2">
                <Label>Event Actions</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDuplicate}
                    className="transition-all duration-200 hover:shadow-sm bg-transparent"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className={cn(
                      "text-destructive hover:text-destructive bg-transparent transition-all duration-200",
                      " hover:bg-red-50 dark:hover:bg-red-950/20 hover:shadow-sm",
                    )}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="transition-all duration-200 bg-transparent"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !selectedCalendarId || isLoading}
            className={cn(
              "bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200",
              "shadow-sm",
              "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
            )}
          >
            <Save className="h-4 w-4 mr-2" />
            {selectedEvent ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
