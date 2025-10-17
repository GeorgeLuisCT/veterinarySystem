"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PaginatedResponse } from "@/types/paginated-response";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import DataTable from "@/components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { LaboratoryRequestService } from "../service/laboratory-request-service";
import { LaboratoryRequestListParams, LaboratoryRequestSummaryResponse } from "../types/laboratory-request-response";

export default function LabRequestsPage() {
    const router = useRouter();
    const [pageData, setPageData] = useState<PaginatedResponse<LaboratoryRequestSummaryResponse> | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [filters, setFilters] = useState<Partial<LaboratoryRequestListParams>>({});
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await LaboratoryRequestService.list({
                page: pageIndex,
                size: pageSize,
                ...filters,
            });
            setPageData(resp);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Error al cargar las solicitudes." });
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize, filters, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const columns: ColumnDef<LaboratoryRequestSummaryResponse>[] = useMemo(() => [
        { accessorKey: "id", header: "ID" },
        { accessorKey: "animalName", header: "Paciente" },
        { accessorKey: "laboratoryName", header: "Laboratorio" },
        { accessorKey: "requestingEmployeeFullName", header: "Solicitante" },
        {
            accessorKey: "createdAt",
            header: "Fecha Creación",
            cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
        },
        { accessorKey: "status", header: "Estado" },
    ], []);

    const onRowClick = useCallback((row: LaboratoryRequestSummaryResponse) => {
        router.push(`/dashboard/clinical/laboratory/${row.id}`);
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Solicitudes de Laboratorio</CardTitle>
                            <CardDescription>Gestiona las solicitudes de laboratorio.</CardDescription>
                        </div>
                        <Button onClick={() => router.push("/dashboard/clinical/laboratory/new")}><PlusCircle className="mr-2 h-4 w-4" />Crear Solicitud</Button>
                    </CardHeader>
                    <CardContent>
                        {/* TODO: Add filters UI */}
                        <DataTable<LaboratoryRequestSummaryResponse>
                            pageData={pageData}
                            columns={columns}
                            loading={loading}
                            pageIndex={pageIndex}
                            pageSize={pageSize}
                            onPageIndexChange={setPageIndex}
                            onPageSizeChange={setPageSize}
                            getRowKey={(row) => row.id}
                            onRowClick={onRowClick}
                            emptyState={<div className="text-muted-foreground">No se encontraron solicitudes.</div>}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}