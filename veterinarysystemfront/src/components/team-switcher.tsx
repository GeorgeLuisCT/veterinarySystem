"use client";

import * as React from "react";
import { Building, Check, ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser } from "@/context/user-context";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { selectBranch } from "@/app/dashboard/branche/services/select-branch";
import { RoleName } from "@/enums/role-name";

export function TeamSwitcher({
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const { userInfo, setUserInfo } = useUser();

  const selectedBranch = userInfo?.selectedBranch;

  if (!selectedBranch) {
    return null;
  }

  const canViewAllBranches =
    userInfo?.roles.includes(RoleName.ROLE_ADMIN) ||
    userInfo?.roles.includes(RoleName.ROLE_MANAGER);

  const handleSelectBranch = async (branch: BranchResponse) => {
    try {
      const newToken = await selectBranch(branch.id);

      if (newToken && userInfo) {
        const updatedUser = {
          ...userInfo,
          selectedBranch: branch,
        };
        
        setUserInfo(updatedUser);
      }
    } catch (error) {
      console.error("Error al seleccionar la sucursal:", error);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userInfo?.companyName}</span>
                <span className="truncate text-xs">{selectedBranch?.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Selecciona tu sucursal
            </DropdownMenuLabel>

            {userInfo?.branches.map((branch) => {
              const isSelected = selectedBranch?.id === branch.id;
              return (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => handleSelectBranch(branch)}
                  className={`gap-2 p-2 ${isSelected ? "bg-muted font-semibold" : ""}`}
                >
                  <Building className="size-4 text-muted-foreground" />
                  {branch.name}
                  {isSelected && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
              );
            })}

            {canViewAllBranches && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleSelectBranch({ id: 0, name: "Todas las sucursales" } as BranchResponse)}
                  className={`gap-2 p-2 ${selectedBranch?.id === 0 ? "bg-muted text-primary font-semibold" : "text-primary"
                    }`}
                >
                  <Building className="size-4" />
                  Todas las sucursales
                  {selectedBranch?.id === 0 && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="gap-2 p-2">
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Añadir sucursal</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}