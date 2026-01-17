import { ReactNode } from "react";
import { CalendarProviders } from "../../schedule/providers/calendar-providers";

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return <CalendarProviders>{children}</CalendarProviders>;
}
