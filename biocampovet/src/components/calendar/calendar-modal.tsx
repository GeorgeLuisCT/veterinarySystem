"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useCalendar, type Calendar } from "./calendar-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, Palette } from "lucide-react"

const CALENDAR_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#EF4444", // Red
  "#F59E0B", // Orange
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#84CC16", // Lime
  "#6366F1", // Indigo
  "#F97316", // Orange
]

const CALENDAR_TYPES = [
  { value: "personal", label: "Personal" },
  { value: "work", label: "Work" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
]

export function CalendarModal() {
  const {
    selectedCalendar,
    setSelectedCalendar,
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    addCalendar,
    updateCalendar,
    deleteCalendar,
  } = useCalendar()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    type: "personal" as Calendar["type"],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedCalendar) {
      setFormData({
        name: selectedCalendar.name,
        description: selectedCalendar.description || "",
        color: selectedCalendar.color,
        type: selectedCalendar.type,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#3B82F6",
        type: "personal",
      })
    }
    setErrors({})
  }, [selectedCalendar, isCalendarModalOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Calendar name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (selectedCalendar) {
        updateCalendar(selectedCalendar.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          type: formData.type,
        })
      } else {
        addCalendar({
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          type: formData.type,
          isVisible: true,
        })
      }

      handleClose()
    } catch (error) {
      console.error("Error saving calendar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = () => {
    if (selectedCalendar && !selectedCalendar.isDefault) {
      deleteCalendar(selectedCalendar.id)
      handleClose()
    }
  }

  const handleClose = () => {
    setIsCalendarModalOpen(false)
    setSelectedCalendar(null)
    setFormData({
      name: "",
      description: "",
      color: "#3B82F6",
      type: "personal",
    })
    setErrors({})
  }

  return (
    <Dialog open={isCalendarModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {selectedCalendar ? "Edit Calendar" : "Create New Calendar"}
          </DialogTitle>
          <DialogDescription>
            {selectedCalendar
              ? "Update your calendar settings and preferences."
              : "Create a new calendar to organize your events."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Calendar Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter calendar name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter calendar description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Calendar Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: Calendar["type"]) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select calendar type" />
                </SelectTrigger>
                <SelectContent>
                  {CALENDAR_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Calendar Color</Label>
              <div className="flex flex-wrap gap-2">
                {CALENDAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? "border-gray-900 dark:border-gray-100 scale-110"
                        : "border-gray-300 dark:border-gray-600 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {selectedCalendar && !selectedCalendar.isDefault && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Calendar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : selectedCalendar ? "Update Calendar" : "Create Calendar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
