"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PaginatedResponse } from "@/types/paginated-response";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, PlusCircle } from "lucide-react";
import { LaboratoryTestSummaryResponse } from "../types/laboratory-test-response";
import DataTable from "@/components/data-table";
import LaboratoryTestService from "../service/laboratory-test-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LaboratoryTestForm from "./laboratory-test-form";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import LaboratoryTestDetail from "./laboratory-test-detail";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Action } from "@/components/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LaboratoryService from "@/app/dashboard/branche/services/laboratory-service";
import { LaboratoryResponse } from "@/app/dashboard/branche/types/laboratory-response";

export function LaboratoryTestsMain() {
    const [pageData, setPageData] = useState<PaginatedResponse<LaboratoryTestSummaryResponse> | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [laboratoryFilter, setLaboratoryFilter] = useState<number | undefined>(undefined);
    const [allLaboratories, setAllLaboratories] = useState<LaboratoryResponse[]>([]);

    const [activeModal, setActiveModal] = useState<"create" | "edit" | "detail" | null>(null);
    const [selectedTest, setSelectedTest] = useState<LaboratoryTestSummaryResponse | null>(null);
    const [testIdForDetail, setTestIdForDetail] = useState<number | null>(null);
    const [testIdForDelete, setTestIdForDelete] = useState<number | null>(null);
    const [testPendingDelete, setTestPendingDelete] = useState<LaboratoryTestSummaryResponse | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        LaboratoryService.listAll().then(setAllLaboratories);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await LaboratoryTestService.list({
                page: pageIndex,
                size: pageSize,
                q: searchQuery || undefined,
                laboratoryId: laboratoryFilter,
            });
            setPageData(resp);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: getAaxiosErrorMessage(error) ?? "Error al cargar las pruebas de laboratorio.",
            });
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize, searchQuery, laboratoryFilter, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
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

    const openEditModal = useCallback((test: LaboratoryTestSummaryResponse) => {
        setSelectedTest(test);
        setActiveModal("edit");
    }, []);

    const openDetailModal = useCallback((test: LaboratoryTestSummaryResponse) => {
        setTestIdForDetail(test.id);
        setActiveModal("detail");
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setSelectedTest(null);
        setTestIdForDetail(null);
    }, []);

    const openDeleteConfirm = useCallback((test: LaboratoryTestSummaryResponse) => {
        setTestIdForDelete(test.id);
        setTestPendingDelete(test);
    }, []);

    const closeDeleteConfirm = useCallback(() => {
        setTestIdForDelete(null);
        setTestPendingDelete(null);
    }, []);

    const handleDeleteTest = useCallback(async () => {
        if (!testIdForDelete) return;
        try {
            await LaboratoryTestService.delete(testIdForDelete);
            toast({
                variant: "default",
                title: "Éxito",
                description: "Prueba de laboratorio eliminada correctamente.",
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
                description: getAaxiosErrorMessage(error) ?? "No se pudo eliminar la prueba.",
            });
        }
    }, [testIdForDelete, fetchData, closeDeleteConfirm, pageData, pageIndex, toast]);

    const columns: ColumnDef<LaboratoryTestSummaryResponse>[] = useMemo(() => [
        { accessorKey: "code", header: "Código" },
        { accessorKey: "name", header: "Nombre" },
        {
            accessorKey: "price",
            header: "Precio",
            cell: ({ row }) => <span>S/ {Number(row.original.price ?? 0).toFixed(2)}</span>,
        },
        {
            accessorKey: "laboratories",
            header: "Laboratorios Activos",
            cell: ({ row }) => {
                const activeLabs = row.original.laboratories
                    .filter(lab => lab.active)
                    .map(lab => lab.laboratoryName)
                    .join(", ");
                return activeLabs || "N/A";
            },
        },
        {
            accessorKey: "active",
            header: "Estado",
            cell: ({ row }) => (row.original.active ? "Activo" : "Inactivo"),
        },
    ], []);

    const actions: Action<LaboratoryTestSummaryResponse>[] = useMemo(() => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4" />,
            onClick: (row) => openEditModal(row),
        },
        {
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (row) => openDeleteConfirm(row),
        },
    ], [openEditModal, openDeleteConfirm]);

    const onRowClick = useCallback((row: LaboratoryTestSummaryResponse) => {
        openDetailModal(row);
    }, [openDetailModal]);

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Pruebas de Laboratorio</CardTitle>
                        <CardDescription>Gestiona el catálogo de pruebas de laboratorio.</CardDescription>
                    </div>
                    <Button onClick={openCreateModal}><PlusCircle className="mr-2 h-4 w-4" />Añadir Nuevo</Button>
                </div>
                <div className="mt-4">
                    <Select onValueChange={(value) => setLaboratoryFilter(value === "all" ? undefined : Number(value))}>
                        <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder="Filtrar por laboratorio" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los laboratorios</SelectItem>
                            {allLaboratories.map(lab => (
                                <SelectItem key={lab.id} value={String(lab.id)}>{lab.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="h-full">
                <DataTable<LaboratoryTestSummaryResponse>
                    pageData={pageData}
                    columns={columns}
                    actions={actions}
                    loading={loading}
                    onSearch={handleSearch}
                    pageIndex={pageIndex}
                    pageSize={pageSize}
                    onPageIndexChange={setPageIndex}
                    onPageSizeChange={handlePageSizeChange}
                    searchPlaceholder="Buscar por código o nombre…"
                    getRowKey={(row) => row.id}
                    onRowClick={onRowClick}
                    emptyState={<div className="text-muted-foreground">No se encontraron pruebas.</div>}
                />

                <Dialog open={activeModal === "create"} onOpenChange={(open) => !open && closeModal()}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Registrar Prueba de Laboratorio</DialogTitle>
                            <DialogDescription>
                                Completa la información para registrar una nueva prueba.
                            </DialogDescription>
                        </DialogHeader>
                        <LaboratoryTestForm setOpen={closeModal} onSuccess={handleFormSuccess} />
                    </DialogContent>
                </Dialog>

                <Dialog open={activeModal === "edit"} onOpenChange={(open) => !open && closeModal()}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Editar Prueba de Laboratorio</DialogTitle>
                            <DialogDescription>
                                Actualiza los datos de la prueba.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedTest && (
                            <LaboratoryTestForm
                                setOpen={closeModal}
                                testId={selectedTest.id}
                                onSuccess={handleFormSuccess}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={activeModal === "detail"} onOpenChange={(open) => !open && closeModal()}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Detalle de la Prueba de Laboratorio</DialogTitle>
                            <DialogDescription>
                                Consulta la información completa de la prueba.
                            </DialogDescription>
                        </DialogHeader>
                        {testIdForDetail && <LaboratoryTestDetail labTestId={testIdForDetail} />}
                    </DialogContent>
                </Dialog>

                <ConfirmationDialog
                    open={!!testIdForDelete}
                    onClose={closeDeleteConfirm}
                    title="¿Eliminar prueba de laboratorio?"
                    description={
                        <span>
                            Esta acción eliminará <strong>{testPendingDelete?.name ?? "la prueba seleccionada"}</strong>
                            . No podrás recuperarla posteriormente.
                        </span>
                    }
                    confirmText="Eliminar"
                    confirmVariant="destructive"
                    onConfirm={handleDeleteTest}
                />
            </CardContent>
        </Card>
    );
}