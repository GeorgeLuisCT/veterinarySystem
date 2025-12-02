"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PlusCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";

import { LaboratoryRequestService } from "../service/laboratory-request-service";
import { LaboratoryRequestSummaryResponse } from "../types/laboratory-request-response";
import { LabRequestStatusLabels } from "../enums/lab-request-status";

import LaboratoryFilters, { LaboratoryFilters as Filters } from "../components/laboratory/laboratory-filters";
import LaboratoryCard, { LaboratoryCardData } from "../components/laboratory/laboratory-card";

function formatLocalDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function toDateParam(v?: string | Date | null): string | undefined {
    if (!v) return undefined;
    return v instanceof Date ? formatLocalDate(v) : v;
}

export default function LabRequestsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { userInfo } = useUser();
    const selectedBranchId = userInfo?.selectedBranch?.id || undefined;

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const [filters, setFilters] = useState<Filters>({
        status: "ALL",
        startDate: today,
        endDate: today,
    });

    const [requests, setRequests] = useState<LaboratoryRequestSummaryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search] = useState("");

    const loadRequests = useCallback(async () => {
        const startDate = toDateParam(filters.startDate);
        const endDate = toDateParam(filters.endDate);

        const statuses = filters.status === "ALL" ? undefined : [filters.status];

        try {
            const resp = await LaboratoryRequestService.list({
                page: 0,
                size: 200, // Fetch enough for the board
                statuses,
                branchId: selectedBranchId,
                startDate,
                endDate,
            });
            setRequests(resp.content);
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Error al cargar las solicitudes." });
        }
    }, [filters.status, filters.startDate, filters.endDate, selectedBranchId, toast]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            await loadRequests();
        } finally {
            setLoading(false);
        }
    }, [loadRequests]);

    useEffect(() => {
        void fetchAll();
        const i = setInterval(fetchAll, 60000);
        return () => clearInterval(i);
    }, [fetchAll]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadRequests();
        } finally {
            setRefreshing(false);
        }
    }, [loadRequests]);

    const unifiedItems: LaboratoryCardData[] = useMemo(() => {
        return requests
            .map((r) => ({
                id: r.id,
                animalName: r.animalName,
                species: r.animalSpecies,
                breed: r.animalBreed,
                requestingEmployeeFullName: r.requestingEmployeeFullName,
                createdAt: r.createdAt,
                badgeLabel: LabRequestStatusLabels[r.status],
                status: r.status,
                laboratoryName: r.laboratoryName,
                // clinicalNotes is not in summary, but we can add it if needed or just leave it empty
                // For now, we don't have it in summary response, so undefined.
            }))
            .filter((it) => {
                if (!search.trim()) return true;
                const haystack = [
                    it.animalName,
                    it.requestingEmployeeFullName ?? "",
                    it.laboratoryName ?? "",
                    String(it.id),
                ]
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(search.trim().toLowerCase());
            })
            .sort((a, b) => {
                // Sort by creation date desc
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [requests, search]);

    if (loading) {
        return <div className="flex justify-center items-center h-[60vh]">Cargando laboratorio...</div>;
    }

    return (
        <div className="h-full bg-gray-50 p-4 sm:p-6">
            <div className="max-w-screen-2xl mx-auto">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Laboratorio</h1>
                        <p className="text-gray-600 mt-1">Gestión de solicitudes y resultados de laboratorio.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleRefresh} className="gap-2" disabled={refreshing}>
                            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                            {refreshing ? "Actualizando..." : "Actualizar"}
                        </Button>
                    </div>
                </div>

                <div className="mb-4 flex flex-col gap-3">
                    <LaboratoryFilters value={filters} onChange={setFilters} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {unifiedItems.map((item) => (
                        <LaboratoryCard key={item.id} data={item} />
                    ))}
                </div>
                {unifiedItems.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">No hay solicitudes para los filtros seleccionados.</div>
                )}
            </div>
        </div>
    );
}