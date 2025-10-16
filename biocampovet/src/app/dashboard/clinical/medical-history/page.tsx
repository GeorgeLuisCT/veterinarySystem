"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardLayoutSection from "../../dashboard-layout-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, AlertCircle, PawPrint, User, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { AnimalSummaryResponse } from "../../patients/animals/types/animal-summary-response";
import { ColumnDef } from "@tanstack/react-table";
import AnimalService from "../../patients/animals/service/animal-service";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/data-table";
import { PaginatedResponse } from "@/types/paginated-response";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ClinicalHistoryPage() {
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const [animals, setAnimals] = useState<PaginatedResponse<AnimalSummaryResponse>>();

  const { toast } = useToast();
  const router = useRouter();

  const stats = [
    {
      title: "Pacientes Totales",
      value: "1,284",
      change: "+12.5%",
      icon: PawPrint,
      trend: "up",
    },
    {
      title: "Citas Hoy",
      value: "23",
      change: "8 pendientes",
      icon: Calendar,
      trend: "neutral",
    },
    {
      title: "Ingresos del Mes",
      value: "$45,231",
      change: "+18.2%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Emergencias Activas",
      value: "3",
      change: "Requieren atención",
      icon: AlertCircle,
      trend: "down",
    },
  ]

  const animalColumns: ColumnDef<AnimalSummaryResponse>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Animal",
        cell: ({ row }) => (
          <div className="px-2 py-3">
            <div className="flex items-center gap-3">
              <PawPrint className="h-5 w-5 text-primary" />
              <div>
                <Link href={`/dashboard/animals/${row.original.id}`} className="font-bold hover:underline">
                  {row.original.name}
                </Link>
                {/* Mostramos la raza como un detalle secundario */}
                <div className="text-xs text-muted-foreground">{row.original.breed ?? "Raza no especificada"}</div>
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "speciesName",
        header: "Especie",
        cell: ({ row }) => (
          <div className="px-2 py-3">
            <Badge variant="outline">{row.original.speciesName ?? "—"}</Badge>
          </div>
        ),
      },
      {
        accessorKey: "birthDate",
        header: "Edad",
        cell: ({ row }) => {
          const birthDate = row.original.birthDate ? new Date(row.original.birthDate) : null;
          const age = birthDate ? formatDistanceToNow(birthDate, { addSuffix: true, locale: es }) : "—";

          return (
            <div className="px-2 py-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium text-foreground">{age.replace("hace aproximadamente", "").trim()}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "ownerName",
        header: "Dueño",
        cell: ({ row }) => (
          <div className="px-2 py-3 flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.ownerName ?? "Sin dueño"}</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => {
          const animal = row.original;

          return (
            <div className="text-right px-2 py-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/animals/${animal.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Ficha
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/animals/edit/${animal.id}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => {
                      // Lógica para abrir modal de eliminación
                      // setAnimalToDelete(animal);
                      // setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  useEffect(() => {
    fetchAnimals(0, 10, searchQuery);
  }, [searchQuery]);

  const fetchAnimals = async (page: number, pageSize: number, query?: string) => {
    setLoading(true);
    try {
      const response = await AnimalService.getAnimals({
        page,
        size: pageSize,
        active: true,
        query,
      });
      setAnimals(response);
    } catch (error: unknown) {
      const message = getAaxiosErrorMessage(error) || "Error al cargar animales";
      toast({ variant: "destructive", title: "Error", description: message });
      console.error("Error fetching animals:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayoutSection>
      <div className="space-y-6">

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p
                  className={`text-xs ${stat.trend === "up" ? "text-accent" : stat.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <DataTable<AnimalSummaryResponse>
          data={animals?.content || []}
          columns={animalColumns}
          fetchData={fetchAnimals}
          onSearch={setSearchQuery}
          totalPages={animals?.totalPages || 1}
          loading={loading}
          searchPlaceholder="Buscar por nombre, especie, raza o dueño..."
        />


      </div>
    </DashboardLayoutSection>
  );
}
