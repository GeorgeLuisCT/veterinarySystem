"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaginatedResponse } from "@/types/paginated-response";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreHorizontal, PlusCircle } from "lucide-react";
import { useUser } from "@/context/user-context";
import {
  ClinicalServiceSummaryResponse,
} from "../types/clinical-service-response";
import {
  ClinicalServiceCategory,
  ClinicalServiceCategoryLabels,
} from "../enums/clinical-service-category";
import DataTable from "@/components/data-table";
import ClinicalServiceService from "../service/clinical-service-service";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClinicalServiceForm from "./clinical-service-form";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import ClinicalServiceDetail from "./clinical-service-detail";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type PendingKey = `${number}-${number}`;

export default function ClinicalServicesMain() {
  const { userInfo } = useUser();
  const selectedBranchId = userInfo?.selectedBranch?.id;

  const [pageData, setPageData] = useState<PaginatedResponse<ClinicalServiceSummaryResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [category, setCategory] = useState<ClinicalServiceCategory | undefined>(undefined);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [activeModal, setActiveModal] = useState<"create" | "edit" | "detail" | null>(null);
  const [selectedService, setSelectedService] = useState<ClinicalServiceSummaryResponse | null>(null);
  const [serviceIdForDetail, setServiceIdForDetail] = useState<number | null>(null);
  const [serviceIdForDelete, setServiceIdForDelete] = useState<number | null>(null);
  const [servicePendingDelete, setServicePendingDelete] = useState<ClinicalServiceSummaryResponse | null>(null);
  const [pending, setPending] = useState<Record<PendingKey, boolean>>({});

  const { toast } = useToast();

  const columns = useMemo<ColumnDef<ClinicalServiceSummaryResponse>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: "Servicio/Procedimiento",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{r.name}</span>
              <div className="text-xs text-muted-foreground">
                {ClinicalServiceCategoryLabels[r.clinicalServiceCategory as ClinicalServiceCategory] ?? r.clinicalServiceCategory}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => <span>{row.original.description}</span>,
      },
      {
        accessorKey: "price",
        header: "Precio estándar",
        cell: ({ row }) => <span>S/ {Number(row.original.price ?? 0).toFixed(2)}</span>,
      },
      {
        id: "branchActivity",
        header: "Estado",
        cell: ({ row }) => {
          const service = row.original;
          const selected = service.branches?.find(b => b.branchId === selectedBranchId);
          const isActive = selected?.active ?? false;

          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs
                ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                title={selected ? selected.branchName : "Sin estado para la sucursal seleccionada"}
              >
                {selected ? (isActive ? "Activo" : "Inactivo") : "—"}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Gestionar sucursales" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {service.branches?.length ? (
                    service.branches.map((b) => {
                      const key: PendingKey = `${service.id}-${b.branchId}`;
                      const isPending = !!pending[key];

                      return (
                        <DropdownMenuItem
                          key={b.branchId}
                          className="flex items-center justify-between gap-3"
                          onClick={(e) => e.preventDefault()}
                        >
                          <span className="text-sm">{b.branchName}</span>
                          <Switch
                            checked={b.active}
                            disabled={isPending}
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={async (next) => {
                              const pkey: PendingKey = `${service.id}-${b.branchId}`;
                              setPending((st) => ({ ...st, [pkey]: true }));
                              try {
                                const updated = await ClinicalServiceService.setBranchActivation(service.id, {
                                  branchId: b.branchId,
                                  active: next,
                                });
                                setPageData((prevData) => {
                                  if (!prevData) return null;
                                  const updatedContent = prevData.content.map((s) => (s.id === service.id ? updated : s));
                                  return { ...prevData, content: updatedContent };
                                });
                              } finally {
                                setPending((st) => {
                                  const newState = { ...st };
                                  delete newState[pkey];
                                  return newState;
                                });
                              }
                            }}
                          />
                        </DropdownMenuItem>
                      );
                    })
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Sin sucursales asociadas
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [selectedBranchId, pending]);

  const fetchData = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const resp = await ClinicalServiceService.list({
        page: pageIndex,
        size: pageSize,
        q: searchQuery || undefined,
        category,
      });
      setPageData(resp);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "Error al cargar los servicios.",
      });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, searchQuery, category, selectedBranchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPageIndex(0);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as ClinicalServiceCategory | "";
    const next = v === "" ? undefined : (v as ClinicalServiceCategory);
    setCategory(next);
    setPageIndex(0);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleFormSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = useCallback(() => {
    setActiveModal("create");
  }, []);

  const openEditModal = useCallback((service: ClinicalServiceSummaryResponse) => {
    setSelectedService(service);
    setActiveModal("edit");
  }, []);

  const openDetailModal = useCallback((service: ClinicalServiceSummaryResponse) => {
    setServiceIdForDetail(service.id);
    setActiveModal("detail");
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedService(null);
    setServiceIdForDetail(null);
  }, []);

  const openDeleteConfirm = useCallback((service: ClinicalServiceSummaryResponse) => {
    setServiceIdForDelete(service.id);
    setServicePendingDelete(service);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setServiceIdForDelete(null);
    setServicePendingDelete(null);
  }, []);

  const handleDeleteService = useCallback(async () => {
    if (!serviceIdForDelete) return;
    try {
      await ClinicalServiceService.delete(serviceIdForDelete);
      toast({
        variant: "default",
        title: "Éxito",
        description: "Servicio eliminado correctamente",
      });
      closeDeleteConfirm();
      if (pageData?.content.length === 1 && pageIndex > 0) {
        setPageIndex(pageIndex - 1);
      } else {
        fetchData();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudo eliminar el servicio.",
      });
    }
  }, [serviceIdForDelete, fetchData, closeDeleteConfirm, pageData, pageIndex]);

  const actions = useMemo(() => [
    {
      label: "Editar",
      type: "direct" as const,
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: ClinicalServiceSummaryResponse) => openEditModal(row),
    },
    {
      label: "Eliminar",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: ClinicalServiceSummaryResponse) => openDeleteConfirm(row),
    },
  ], [openEditModal, openDeleteConfirm]);

  const onRowClick = useCallback((row: ClinicalServiceSummaryResponse) => {
    openDetailModal(row);
  }, [openDetailModal]);

  const headerRight = (
    <div>
      <select
        className="border border-border rounded-md p-1 bg-background"
        value={category ?? ""}
        onChange={handleCategoryChange}
      >
        <option value="">Todas las categorías</option>
        {(Object.values(ClinicalServiceCategory) as ClinicalServiceCategory[]).map((c) => (
          <option key={c} value={c}>
            {ClinicalServiceCategoryLabels[c]}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Servicios y Procedimientos</CardTitle>
          <CardDescription>Gestiona el catálogo clínico por sucursal.</CardDescription>
        </div>
        <Button onClick={openCreateModal}><PlusCircle className="mr-2 h-4 w-4" />Añadir Nuevo</Button>
      </CardHeader>
      <CardContent className="h-full">
        <DataTable<ClinicalServiceSummaryResponse>
          pageData={pageData}
          columns={columns}
          actions={actions}
          loading={loading}
          onSearch={handleSearch}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={handlePageSizeChange}
          searchPlaceholder="Buscar por nombre…"
          headerSlotRight={headerRight}
          getRowKey={(row) => row.id}
          onRowClick={onRowClick}
          emptyState={<div className="text-muted-foreground">No se encontraron servicios/procedimientos.</div>}
        />

        <Dialog open={activeModal === "create"} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar servicio clínico</DialogTitle>
              <DialogDescription>
                Completa la información para registrar un nuevo servicio o procedimiento clínico.
              </DialogDescription>
            </DialogHeader>
            <ClinicalServiceForm setOpen={closeModal} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "edit"} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar servicio clínico</DialogTitle>
              <DialogDescription>
                Actualiza los datos del servicio. Los cambios se aplican a todas las sucursales donde esté activo.
              </DialogDescription>
            </DialogHeader>
            {selectedService && (
              <ClinicalServiceForm
                setOpen={closeModal}
                serviceId={selectedService.id}
                onSuccess={handleFormSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "detail"} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalle del servicio clínico</DialogTitle>
              <DialogDescription>
                Consulta la información completa del servicio y sus configuraciones asociadas.
              </DialogDescription>
            </DialogHeader>
            {serviceIdForDetail && <ClinicalServiceDetail serviceId={serviceIdForDetail} />}
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={!!serviceIdForDelete}
          onClose={closeDeleteConfirm}
          title="¿Eliminar servicio clínico?"
          description={
            <span>
              Esta acción eliminará <strong>{servicePendingDelete?.name ?? "el servicio seleccionado"}</strong>
              . No podrás recuperarlo posteriormente.
            </span>
          }
          confirmText="Eliminar"
          confirmVariant="destructive"
          onConfirm={handleDeleteService}
        />
      </CardContent>
    </Card>
  );
}