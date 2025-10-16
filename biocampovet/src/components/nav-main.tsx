"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useUser } from "@/context/user-context";
import { navigationConfig } from "@/config/navigation";
import { RoleName } from "@/enums/role-name";
import { useSidebar } from "@/components/ui/sidebar";

export function NavMain({
  mainTitle,
  items,
}: {
  mainTitle: string;
  items: typeof navigationConfig.navMain;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [wasNavigated, setWasNavigated] = useState(false);
  const { userInfo } = useUser();
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (wasNavigated) {
      setLoadingUrl(null);
      if (isMobile) {
        setOpenMobile(false);
      }
      setWasNavigated(false);
    }
  }, [pathname]);

  const userRoles = userInfo?.roles || [];

  const filteredItems = items
    .filter((section) => section.rolesAllowed.some((role) => userRoles.includes(role as RoleName)))
    .map((section) => ({
      ...section,
      isActive: pathname.startsWith(section.url),
      items: section.items?.filter((subItem) =>
        subItem.rolesAllowed.some((role) => userRoles.includes(role as RoleName))
      ),
    }));

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{mainTitle}</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {loadingUrl === item.url ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    item.icon && <item.icon />
                  )}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <Link
                          href={subItem.url}
                          onClick={(e) => {
                            e.preventDefault();
                            setLoadingUrl(subItem.url);
                            setWasNavigated(true);
                            router.push(subItem.url);
                          }}
                        >
                          {loadingUrl === subItem.url ? (
                            <Loader2 className="animate-spin mr-2" />
                          ) : null}
                          {subItem.title}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
