"use client";

import { ReactNode } from "react";
import { CalendarProvider } from "@/components/calendar/calendar-context";
import { AnalyticsProvider } from "@/components/calendar/analytics-context";

export function CalendarProviders({ children }: { children: ReactNode }) {
  return (
    <CalendarProvider>
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </CalendarProvider>
  );
}
