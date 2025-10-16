"use client"

import { useState } from "react"
import { useAnalytics } from "./analytics-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, Calendar, Clock, Target, Zap, Award, BarChart3 } from "lucide-react"
import { format } from "date-fns"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"]


interface AnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  const { analyticsData } = useAnalytics()
  const [activeTab, setActiveTab] = useState("overview")

  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { level: "Excellent", color: "text-green-600", bgColor: "bg-green-100" }
    if (score >= 60) return { level: "Good", color: "text-blue-600", bgColor: "bg-blue-100" }
    if (score >= 40) return { level: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100" }
    return { level: "Needs Improvement", color: "text-red-600", bgColor: "bg-red-100" }
  }

  const productivity = getProductivityLevel(analyticsData.productivityScore)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Calendar Analytics
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Events</span>
                </div>
                <div className="text-2xl font-bold mt-1">{analyticsData.totalEvents}</div>
                <div className="text-xs text-muted-foreground">Last 30 days</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Total Hours</span>
                </div>
                <div className="text-2xl font-bold mt-1">{analyticsData.totalHours}h</div>
                <div className="text-xs text-muted-foreground">Time in events</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">Avg Duration</span>
                </div>
                <div className="text-2xl font-bold mt-1">{analyticsData.averageEventDuration}m</div>
                <div className="text-xs text-muted-foreground">Per event</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Productivity</span>
                </div>
                <div className="text-2xl font-bold mt-1">{analyticsData.productivityScore}%</div>
                <Badge variant="outline" className={`text-xs mt-1 ${productivity.color} ${productivity.bgColor}`}>
                  {productivity.level}
                </Badge>
              </Card>
            </div>

            {/* Productivity Score */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Productivity Score</h3>
                <Badge variant="outline" className={`${productivity.color} ${productivity.bgColor}`}>
                  {productivity.level}
                </Badge>
              </div>
              <Progress value={analyticsData.productivityScore} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                Based on your event distribution and work-life balance over the last 30 days.
              </p>
            </Card>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Busiest Day</h4>
                <div className="text-xl font-semibold text-blue-600">{analyticsData.busiestDay}</div>
                <p className="text-sm text-muted-foreground">Most events scheduled</p>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-2">Peak Hour</h4>
                <div className="text-xl font-semibold text-green-600">
                  {format(new Date().setHours(analyticsData.busiestHour), "h:mm a")}
                </div>
                <p className="text-sm text-muted-foreground">Most active time</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {/* Weekly Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">This Week's Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="events" fill="#3B82F6" name="Events" />
                  <Bar dataKey="hours" fill="#10B981" name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Category Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Events by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ category, count }) => `${category}: ${count}`}
                    >
                      {analyticsData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {analyticsData.categoryBreakdown.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{category.count} events</div>
                        <div className="text-xs text-muted-foreground">{category.hours}h total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Time Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Events by Hour of Day</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analyticsData.timeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(hour) => format(new Date().setHours(hour), "ha")} />
                  <YAxis />
                  <Tooltip labelFormatter={(hour) => format(new Date().setHours(hour as number), "h:mm a")} />
                  <Area type="monotone" dataKey="events" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Upcoming Busy Days */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Upcoming Busy Days</h3>
              {analyticsData.upcomingBusyDays.length > 0 ? (
                <div className="space-y-3">
                  {analyticsData.upcomingBusyDays.map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{day.date}</span>
                      <Badge variant="outline">
                        {day.events} event{day.events !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No busy days coming up. Great time to plan ahead!</p>
              )}
            </Card>

            {/* Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">Schedule Optimization</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {analyticsData.productivityScore >= 70
                    ? "Your schedule looks well-balanced! Keep up the good work."
                    : "Consider spacing out your events more evenly throughout the week."}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-medium">Peak Performance</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  You're most active on {analyticsData.busiestDay}s around{" "}
                  {format(new Date().setHours(analyticsData.busiestHour), "h a")}. Schedule important meetings during
                  this time.
                </p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Monthly Trend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">6-Month Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" stroke="#3B82F6" strokeWidth={2} name="Events" />
                  <Line type="monotone" dataKey="hours" stroke="#10B981" strokeWidth={2} name="Hours" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Calendar Heatmap Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Activity Heatmap (Last 90 Days)</h3>
              <div className="grid grid-cols-10 gap-1">
                {analyticsData.heatmapData.slice(-70).map((day, index) => (
                  <div
                    key={day.date}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor:
                        day.value === 0 ? "#f3f4f6" : `rgba(59, 130, 246, ${Math.min(day.value / 5, 1)})`,
                    }}
                    title={`${day.date}: ${day.value} events`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0, 0.2, 0.4, 0.6, 0.8, 1].map((opacity, index) => (
                    <div
                      key={index}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
