"use client";

import * as React from "react";
import { Loader2, Mail, Phone, UserRound, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { getAaxiosErrorMessage } from "@/helpers/error";
import UserService from "../service/users-service";
import { UserDetailResponse } from "../types/user-detail-response";

type Props = {
  userId: number;
};

export function UserDetail({ userId }: Props) {
  const [data, setData] = React.useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const getRoleLabel = (role: string) => role.replace("ROLE_", "");

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const response = await UserService.getUserDetail(userId);
        if (mounted) {
          setData(response);
        }
      } catch (error) {
        const message =
          getAaxiosErrorMessage(error) || "No pudimos obtener los detalles del usuario";
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (userId) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-muted-foreground">No se encontraron datos del usuario.</p>;
  }

  return (
    <ScrollArea className="max-h-[70vh] pr-3">
      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Usuario</p>
              <p className="text-xl font-semibold">{data.username}</p>
              <p className="text-xs text-muted-foreground">ID #{data.userId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="text-lg font-semibold">
                {data.active ? "Activo" : "Inactivo"}
              </p>
              <Badge
                variant={data.active ? "outline" : "secondary"}
                className={`mt-1 ${data.active ? "text-emerald-700" : ""}`}
              >
                {data.active ? "Habilitado" : "Suspendido"}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Roles asignados</p>
            <div className="flex flex-wrap gap-2">
              {data.roles.map((role) => (
                <Badge key={role} variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  {getRoleLabel(role)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <UserRound className="h-5 w-5 text-muted-foreground" />
            Información del empleado
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Nombre completo</p>
              <p className="font-medium">
                {data.firstName} {data.lastName}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Cargo</p>
              <p className="font-medium">{data.burden}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{data.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{data.phoneNumber || "Sin teléfono"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Sucursales asignadas</p>
          {data.branches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tiene sucursales disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.branches.map((branch) => (
                <div key={branch.id} className="rounded-xl border px-4 py-2">
                  <p className="font-semibold">{branch.name}</p>
                  <p className="text-xs text-muted-foreground">{branch.location}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
