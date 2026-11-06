"use client";

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { FloatingLabelDateInput } from '@/components/floating-label-date-input';
import { FloatingLabelInput } from '@/components/floating-label-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/context/user-context';
import { getAaxiosErrorMessage } from '@/helpers/error';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, ChevronLeft, ChevronRight, LogOut, PlusCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddTreatmentModal } from '../../components/hospitalization/add-treatment-modal';
import { CompleteTreatmentModal } from '../../components/hospitalization/complete-treatment-modal';
import { ViewTreatmentModal } from '../../components/hospitalization/view-treatment-modal';
import { HospitalizationStatus } from '../../enums/hospitalization-status';
import HospitalizationService from '../../service/hospitalization-service';
import { HospitalizationResponse, TreatmentScheduleResponse } from '../../types/hospitalization-response';

const BASE_TIME_SLOTS = [
    "00:00",
    "02:00",
    "04:00",
    "06:00",
    "08:00",
    "10:00",
    "12:00",
    "14:00",
    "16:00",
    "18:00",
    "20:00",
    "22:00",
];

export default function HospitalizationChartPage() {
    const params = useParams();
    const { toast } = useToast();
    const { userInfo } = useUser();
    const [hospitalization, setHospitalization] = useState<HospitalizationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddTreatmentModalOpen, setAddTreatmentModalOpen] = useState(false);
    const [completeTreatmentModal, setCompleteTreatmentModal] = useState<{ open: boolean; schedule: TreatmentScheduleResponse } | null>(null);
    const [viewTreatmentModal, setViewTreatmentModal] = useState<{ open: boolean; schedule: TreatmentScheduleResponse } | null>(null);
    const [newEvolutionNote, setNewEvolutionNote] = useState("");
    const [isSavingEvolutionNote, setIsSavingEvolutionNote] = useState(false);
    const [vitalForm, setVitalForm] = useState({
        weightKg: "",
        temperatureCelsius: "",
        heartRate: "",
        respiratoryRate: "",
    });
    const [isSavingVitals, setIsSavingVitals] = useState(false);
    const [isDischarging, setIsDischarging] = useState(false);
    const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false);

    const toDateKey = useCallback((date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }, []);

    const parseDateKey = useCallback((key: string) => {
        const [year, month, day] = key.split("-").map(Number);
        return new Date(year, (month || 1) - 1, day || 1);
    }, []);

    const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

    const formatTimeSlot = useCallback((isoDate: string) => {
        const date = new Date(isoDate);
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }, []);

    const hospitalizationId = Number(params.patientId);

    const fetchHospitalization = useCallback(async () => {
        if (!hospitalizationId) return;
        setLoading(true);
        try {
            const data = await HospitalizationService.getById(hospitalizationId);
            setHospitalization(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: getAaxiosErrorMessage(error) ?? "No se pudo cargar la ficha de hospitalización.",
            });
        } finally {
            setLoading(false);
        }
    }, [hospitalizationId, toast]);

    useEffect(() => {
        fetchHospitalization();
    }, [fetchHospitalization]);

    const dayScheduleEntries = useMemo(() => {
        if (!hospitalization) return [];
        return hospitalization.treatmentSchedules
            .map((schedule) => {
                const scheduledDay = toDateKey(new Date(schedule.scheduledTime));
                if (scheduledDay === selectedDate) {
                    return { schedule, timeKey: formatTimeSlot(schedule.scheduledTime) };
                }
                if (schedule.completedAt) {
                    const completedDay = toDateKey(new Date(schedule.completedAt));
                    if (completedDay === selectedDate) {
                        return { schedule, timeKey: formatTimeSlot(schedule.completedAt) };
                    }
                }
                return null;
            })
            .filter((entry): entry is { schedule: TreatmentScheduleResponse; timeKey: string } => entry !== null);
    }, [hospitalization, selectedDate, toDateKey, formatTimeSlot]);

    const timeSlots = useMemo(() => {
        const slotSet = new Set(BASE_TIME_SLOTS);
        dayScheduleEntries.forEach((entry) => {
            slotSet.add(entry.timeKey);
        });
        return Array.from(slotSet).sort((a, b) => {
            if (a === b) return 0;
            return a < b ? -1 : 1;
        });
    }, [dayScheduleEntries]);

    const allTreatmentNames = useMemo(() => {
        if (!hospitalization) return [];
        return Array.from(new Set(hospitalization.treatmentSchedules.map((schedule) => schedule.treatmentName)));
    }, [hospitalization]);

    const sortedVitalSigns = useMemo(() => {
        if (!hospitalization?.vitalSigns) return [];
        return [...hospitalization.vitalSigns].sort((a, b) => {
            const dateA = a.recordedAt ?? "";
            const dateB = b.recordedAt ?? "";
            if (dateA === dateB) return 0;
            return dateA > dateB ? -1 : 1;
        });
    }, [hospitalization]);

    const latestVitalSign = sortedVitalSigns[0];

    const vitalFormHasValues = Object.values(vitalForm).some((value) => value.trim() !== "");

    const formatVitalValue = (value: number | undefined, suffix: string) => {
        if (value == null) return "N/A";
        return `${value}${suffix}`;
    };

    const hasAnyTreatment = allTreatmentNames.length > 0;

    const selectedDateLabel = useMemo(
        () =>
            parseDateKey(selectedDate).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "2-digit",
                month: "long",
            }),
        [selectedDate, parseDateKey]
    );

    const shiftSelectedDate = (days: number) => {
        const current = parseDateKey(selectedDate);
        current.setDate(current.getDate() + days);
        setSelectedDate(toDateKey(current));
    };

    const handleVitalInputChange = (field: keyof typeof vitalForm) => (value: string) => {
        setVitalForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveVitalSigns = async () => {
        if (!hospitalization) return;
        if (!userInfo?.employeeId) {
            toast({
                variant: "destructive",
                title: "Sin usuario asignado",
                description: "No se pudo identificar al colaborador que registra las constantes vitales.",
            });
            return;
        }

        const parseOptionalNumber = (value: string, label: string, { integer }: { integer?: boolean } = {}) => {
            const trimmed = value.trim();
            if (!trimmed) return undefined;
            const parsed = Number(trimmed);
            if (!Number.isFinite(parsed)) {
                throw new Error(`Valor inválido para ${label}.`);
            }
            if (parsed <= 0) {
                throw new Error(`${label} debe ser mayor que cero.`);
            }
            return integer ? Math.round(parsed) : parsed;
        };

        let weightKg: number | undefined;
        let temperatureCelsius: number | undefined;
        let heartRate: number | undefined;
        let respiratoryRate: number | undefined;

        try {
            weightKg = parseOptionalNumber(vitalForm.weightKg, "Peso");
            temperatureCelsius = parseOptionalNumber(vitalForm.temperatureCelsius, "Temperatura");
            heartRate = parseOptionalNumber(vitalForm.heartRate, "Frecuencia cardiaca", { integer: true });
            respiratoryRate = parseOptionalNumber(vitalForm.respiratoryRate, "Frecuencia respiratoria", { integer: true });
        } catch (validationError) {
            toast({
                variant: "destructive",
                title: "Dato inválido",
                description: validationError instanceof Error ? validationError.message : "Revisa los valores ingresados.",
            });
            return;
        }

        const hasAnyMeasurement = [weightKg, temperatureCelsius, heartRate, respiratoryRate].some(
            (value) => value != null
        );

        if (!hasAnyMeasurement) {
            toast({
                title: "Agrega constantes",
                description: "Registra al menos un valor antes de guardar.",
            });
            return;
        }

        setIsSavingVitals(true);
        try {
            const payload = {
                recordedByEmployeeId: userInfo.employeeId,
                weightKg,
                temperatureCelsius,
                heartRate,
                respiratoryRate,
            };
            const updated = await HospitalizationService.addVitalSigns(hospitalization.id, payload);
            setHospitalization(updated);
            setVitalForm({
                weightKg: "",
                temperatureCelsius: "",
                heartRate: "",
                respiratoryRate: "",
            });
            toast({
                title: "Constantes registradas",
                description: "Se guardó el nuevo registro de constantes vitales.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: getAaxiosErrorMessage(error) ?? "No se pudieron guardar las constantes vitales.",
            });
        } finally {
            setIsSavingVitals(false);
        }
    };

    const handleDischarge = async () => {
        if (!hospitalization || hospitalization.status === HospitalizationStatus.DISCHARGED) return;
        setIsDischarging(true);
        try {
            await HospitalizationService.patch(hospitalization.id, {
                version: hospitalization.version,
                status: HospitalizationStatus.DISCHARGED,
                dischargeDate: new Date().toISOString(),
            });
            const updated = await HospitalizationService.getById(hospitalization.id);
            setHospitalization(updated);
            setIsDischargeDialogOpen(false);
            toast({
                title: "Paciente dado de alta",
                description: "Se registró el alta y se liberará la jaula asociada.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "No se pudo dar de alta",
                description: getAaxiosErrorMessage(error) ?? "Intenta nuevamente en unos segundos.",
            });
        } finally {
            setIsDischarging(false);
        }
    };

    const handleSaveEvolutionNote = async () => {
        if (!hospitalization) return;
        const trimmedNote = newEvolutionNote.trim();
        if (!trimmedNote) {
            toast({
                title: "Agrega una nota",
                description: "Escribe el detalle de la evolución antes de guardar.",
            });
            return;
        }
        if (!userInfo?.employeeId) {
            toast({
                variant: "destructive",
                title: "Sin usuario asignado",
                description: "No se pudo identificar al colaborador que registra la nota.",
            });
            return;
        }
        setIsSavingEvolutionNote(true);
        try {
            const updated = await HospitalizationService.addEvolutionNote(hospitalization.id, {
                authorId: userInfo.employeeId,
                note: trimmedNote,
            });
            setHospitalization(updated);
            setNewEvolutionNote("");
            toast({
                title: "Nota registrada",
                description: "Se agregó la nota de evolución a la hoja.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: getAaxiosErrorMessage(error) ?? "No se pudo guardar la nota.",
            });
        } finally {
            setIsSavingEvolutionNote(false);
        }
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!hospitalization) {
        return <div>No se encontró la hospitalización.</div>;
    }

    const { animalName, admissionDate, evolutionNotes } = hospitalization;
    const isDischarged = hospitalization.status === HospitalizationStatus.DISCHARGED;
    const dischargeButtonLabel = isDischarged ? "Alta registrada" : isDischarging ? "Dando de alta..." : "Dar de Alta";

    return (
        <div className="h-full overflow-y-auto">
            <div className="sticky top-0 z-10 border-b bg-card px-4 py-3 sm:px-6">
                <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ficha de Hospitalización</h1>
                        <p className="text-sm text-muted-foreground">Paciente: <span className="font-semibold text-info-strong">{animalName}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            
                            onClick={() => setIsDischargeDialogOpen(true)}
                            disabled={isDischarging || isDischarged}
                        >
                            <LogOut className="h-4 w-4 mr-2" /> {dischargeButtonLabel}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Hoja de Tratamiento</CardTitle>
                                <p className="text-sm text-muted-foreground capitalize">{selectedDateLabel}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="icon" onClick={() => shiftSelectedDate(-1)} aria-label="Día anterior">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="min-w-[220px]">
                                        <FloatingLabelDateInput
                                            id="treatment-day"
                                            label="Fecha"
                                            mode="date"
                                            value={selectedDate}
                                            onChange={(value) => {
                                                if (!value) return;
                                                const nextValue = value.includes("T") ? value.split("T")[0] : value;
                                                setSelectedDate(nextValue);
                                            }}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" size="icon" onClick={() => shiftSelectedDate(1)} aria-label="Día siguiente">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedDate(toDateKey(new Date()))}>
                                        Hoy
                                    </Button>
                                </div>
                                <Button size="sm" onClick={() => setAddTreatmentModalOpen(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Tratamiento
                                </Button>
                            </div>
                        </CardHeader>
                        <div className="p-4 overflow-x-auto">
                            <table className="w-full border-collapse text-sm text-center">
                                <thead>
                                    <tr className="bg-muted">
                                        <th className="border p-2 font-semibold text-left">Tratamiento</th>
                                        {timeSlots.map(time => <th key={time} className="border p-2 font-semibold">{time}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {!hasAnyTreatment ? (
                                        <tr>
                                            <td colSpan={timeSlots.length + 1} className="border p-4 text-center text-muted-foreground">
                                                Aún no hay tratamientos programados para esta hospitalización.
                                            </td>
                                        </tr>
                                    ) : (
                                        allTreatmentNames.map((treatmentName) => {
                                            const scheduleEntries = dayScheduleEntries.filter(
                                                (entry) => entry.schedule.treatmentName === treatmentName
                                            );
                                            return (
                                                <tr key={treatmentName}>
                                                    <td className="border p-2 text-left font-medium">{treatmentName}</td>
                                                    {timeSlots.map((time) => {
                                                        const entry = scheduleEntries.find((s) => s.timeKey === time);
                                                        const schedule = entry?.schedule;

                                                        if (!schedule) {
                                                            return <td key={time} className="border p-2 bg-muted" />;
                                                        }

                                                        return (
                                                            <td key={time} className="border p-2">
                                                                {schedule.isCompleted ? (
                                                                    <button
                                                                        type="button"
                                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success-strong hover:bg-green-200"
                                                                        title="Ver detalles del tratamiento administrado"
                                                                        onClick={() => setViewTreatmentModal({ open: true, schedule })}
                                                                    >
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCompleteTreatmentModal({ open: true, schedule })}
                                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-info-soft text-info-strong hover:bg-blue-200 text-xs font-bold"
                                                                        title="Registrar administración"
                                                                    >
                                                                        A
                                                                    </button>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Bitácora de Evolución</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {evolutionNotes.map((note) => (
                                    <div key={note.id} className="text-sm border-b pb-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold">{note.authorFullName}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(note.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-muted-foreground">{note.note}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 border-t pt-4">
                                <Textarea
                                    placeholder="Añadir nueva nota de evolución..."
                                    className="mb-2"
                                    value={newEvolutionNote}
                                    onChange={(event) => setNewEvolutionNote(event.target.value)}
                                    disabled={isSavingEvolutionNote}
                                />
                                <Button
                                    size="sm"
                                    type="button"
                                    onClick={handleSaveEvolutionNote}
                                    disabled={isSavingEvolutionNote || !newEvolutionNote.trim()}
                                >
                                    {isSavingEvolutionNote ? "Guardando..." : "Guardar Nota"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <aside className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Resumen del Paciente</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><strong>Fecha de Ingreso:</strong> {new Date(admissionDate).toLocaleString('es-ES')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Constantes Vitales</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {latestVitalSign
                                    ? `Último registro: ${new Date(latestVitalSign.recordedAt).toLocaleString("es-ES", {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })} · ${latestVitalSign.recordedByEmployeeFullName ?? "Sin responsable"}`
                                    : "Aún no hay registros."}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {latestVitalSign ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border p-3 text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Temperatura</p>
                                        <p className="text-lg font-semibold text-foreground">
                                            {formatVitalValue(latestVitalSign.temperatureCelsius, "°C")}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border p-3 text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Peso</p>
                                        <p className="text-lg font-semibold text-foreground">
                                            {formatVitalValue(latestVitalSign.weightKg, " kg")}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border p-3 text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Frecuencia cardiaca</p>
                                        <p className="text-lg font-semibold text-foreground">
                                            {formatVitalValue(latestVitalSign.heartRate, " lpm")}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border p-3 text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Frecuencia respiratoria</p>
                                        <p className="text-lg font-semibold text-foreground">
                                            {formatVitalValue(latestVitalSign.respiratoryRate, " rpm")}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Registra las primeras constantes para comenzar el seguimiento.
                                </p>
                            )}
                            {sortedVitalSigns.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Historial</p>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                        {sortedVitalSigns.map((vital) => (
                                            <div key={vital.id} className="rounded-md border p-2 text-sm">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-semibold">
                                                        {new Date(vital.recordedAt).toLocaleString("es-ES", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                    <span className="text-xs text-muted-foreground">
                                                        {vital.recordedByEmployeeFullName ?? "Sin responsable"}
                                                    </span>
                                                </div>
                                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                    <span>Temp.: {formatVitalValue(vital.temperatureCelsius, "°C")}</span>
                                                    <span>Peso: {formatVitalValue(vital.weightKg, " kg")}</span>
                                                    <span>FC: {formatVitalValue(vital.heartRate, " lpm")}</span>
                                                    <span>FR: {formatVitalValue(vital.respiratoryRate, " rpm")}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="border-t pt-4">
                                <p className="text-sm font-medium mb-3">Registrar nuevas constantes</p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <FloatingLabelInput
                                        id="weightKg"
                                        label="Peso (kg)"
                                        type="number"
                                        step="0.1"
                                        value={vitalForm.weightKg}
                                        onChange={handleVitalInputChange("weightKg")}
                                        disabled={isSavingVitals}
                                    />
                                    <FloatingLabelInput
                                        id="temperatureCelsius"
                                        label="Temperatura (°C)"
                                        type="number"
                                        step="0.1"
                                        value={vitalForm.temperatureCelsius}
                                        onChange={handleVitalInputChange("temperatureCelsius")}
                                        disabled={isSavingVitals}
                                    />
                                    <FloatingLabelInput
                                        id="heartRate"
                                        label="Frecuencia cardiaca (lpm)"
                                        type="number"
                                        step="1"
                                        value={vitalForm.heartRate}
                                        onChange={handleVitalInputChange("heartRate")}
                                        disabled={isSavingVitals}
                                    />
                                    <FloatingLabelInput
                                        id="respiratoryRate"
                                        label="Frecuencia respiratoria (rpm)"
                                        type="number"
                                        step="1"
                                        value={vitalForm.respiratoryRate}
                                        onChange={handleVitalInputChange("respiratoryRate")}
                                        disabled={isSavingVitals}
                                    />
                                </div>
                                <Button
                                    className="mt-3"
                                    size="sm"
                                    type="button"
                                    onClick={handleSaveVitalSigns}
                                    disabled={isSavingVitals || !vitalFormHasValues}
                                >
                                    {isSavingVitals ? "Guardando..." : "Registrar constantes"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>

            {hospitalization && (
                <AddTreatmentModal
                    open={isAddTreatmentModalOpen}
                    onOpenChange={setAddTreatmentModalOpen}
                    hospitalizationId={hospitalization.id}
                    onSuccess={(updated) => setHospitalization(updated)}
                />
            )}

            <ConfirmationDialog
                open={isDischargeDialogOpen}
                onClose={() => setIsDischargeDialogOpen(false)}
                title="Confirmar alta del paciente"
                description="Esta acción marcará la hospitalización como dada de alta y liberará la jaula asignada. ¿Deseas continuar?"
                onConfirm={handleDischarge}
                confirmText={isDischarging ? "Procesando..." : "Confirmar alta"}
                confirmVariant="destructive"
                showTooltip={false}
            />

            {completeTreatmentModal && hospitalization && (
                <CompleteTreatmentModal
                    open={completeTreatmentModal.open}
                    onOpenChange={(open) => !open && setCompleteTreatmentModal(null)}
                    hospitalizationId={hospitalization.id}
                    schedule={completeTreatmentModal.schedule}
                    onSuccess={(updated) => {
                        setHospitalization(updated);
                        setCompleteTreatmentModal(null);
                    }}
                />
            )}

            {viewTreatmentModal && (
                <ViewTreatmentModal
                    open={viewTreatmentModal.open}
                    onOpenChange={(open) => !open && setViewTreatmentModal(null)}
                    schedule={viewTreatmentModal.schedule}
                />
            )}
        </div>
    );
}
