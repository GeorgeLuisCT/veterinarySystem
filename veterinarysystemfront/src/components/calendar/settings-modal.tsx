"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Palette, Bell, Download, Upload, Keyboard } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [weekStartsOn, setWeekStartsOn] = useState("0") // Sunday
  const [timeFormat, setTimeFormat] = useState("12") // 12-hour
  const [defaultView, setDefaultView] = useState("month")
  const [showWeekends, setShowWeekends] = useState(true)
  const [showWeekNumbers, setShowWeekNumbers] = useState(false)
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [defaultReminder, setDefaultReminder] = useState("15")

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".ics,.csv"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Handle file import logic here
        console.log("Importing file:", file.name)
      }
    }
    input.click()
  }

  const handleExport = () => {
    // Export calendar data
    const dataStr =
      "data:text/calendar;charset=utf8," + encodeURIComponent("BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR")
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "my-calendar.ics")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Calendar Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="notifications">Alerts</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Week starts on</Label>
                <Select value={weekStartsOn} onValueChange={setWeekStartsOn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time format</Label>
                <Select value={timeFormat} onValueChange={setTimeFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12-hour (1:00 PM)</SelectItem>
                    <SelectItem value="24">24-hour (13:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default view</Label>
                <Select value={defaultView} onValueChange={setDefaultView}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default reminder</Label>
                <Select value={defaultReminder} onValueChange={setDefaultReminder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">At time of event</SelectItem>
                    <SelectItem value="5">5 minutes before</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show weekends</Label>
                  <p className="text-sm text-muted-foreground">Display Saturday and Sunday in calendar views</p>
                </div>
                <Switch checked={showWeekends} onCheckedChange={setShowWeekends} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show week numbers</Label>
                  <p className="text-sm text-muted-foreground">Display week numbers in month view</p>
                </div>
                <Switch checked={showWeekNumbers} onCheckedChange={setShowWeekNumbers} />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Theme
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm">
                    Light
                  </Button>
                  <Button variant="outline" size="sm">
                    Dark
                  </Button>
                  <Button variant="outline" size="sm">
                    System
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Enable notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive browser notifications for events</p>
                </div>
                <Switch checked={enableNotifications} onCheckedChange={setEnableNotifications} />
              </div>

              <div className="space-y-2">
                <Label>Notification sound</Label>
                <Select defaultValue="default">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="chime">Chime</SelectItem>
                    <SelectItem value="bell">Bell</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Calendar
                </Label>
                <p className="text-sm text-muted-foreground">Download your calendar data as an ICS file</p>
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export to ICS
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Calendar
                </Label>
                <p className="text-sm text-muted-foreground">Import events from ICS or CSV files</p>
                <Button onClick={handleImport} variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import File
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Keyboard Shortcuts
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Create new event</span>
                    <Badge variant="outline">Ctrl + N</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Search events</span>
                    <Badge variant="outline">Ctrl + F</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Go to today</span>
                    <Badge variant="outline">T</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Previous period</span>
                    <Badge variant="outline">←</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Next period</span>
                    <Badge variant="outline">→</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
