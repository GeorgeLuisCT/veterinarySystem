"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { navigationConfig } from "@/config/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={navigationConfig.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationConfig.navMain} mainTitle="Gestión Operativa" />
        <NavMain items={navigationConfig.projects} mainTitle="Administración y Reportes" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navigationConfig.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
