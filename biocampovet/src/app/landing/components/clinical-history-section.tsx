"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { DocumentTypeResponse } from "@/app/dashboard/crm/customers/types/document-type-response";
import type { ClinicalHistoryDetailResponse } from "@/app/dashboard/clinical/types/medical-history-response";
import { AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";
import PublicPortalService from "@/app/landing/service/public-portal-service";
import type { PublicAnimalSummary } from "@/app/landing/types/public-portal.types";

import type { FeedbackMessage, LookupContext } from "./public-landing-page";
import { HistoryFormData, historySchema } from "../types/schemas";
import { formatDateTime, parseErrorMessage } from "../utils/helpers";


interface Props {
    documentTypes: DocumentTypeResponse[];
    animals: PublicAnimalSummary[];
    animalsLoading: boolean;
    lookupFeedback: FeedbackMessage | null;
    lookupContext: LookupContext | null;
    onLookupAnimals: (payload: LookupContext) => Promise<void>;
}

export function ClinicalHistorySection({
    documentTypes,
    animals,
    animalsLoading,
    lookupFeedback,
    lookupContext,
    onLookupAnimals,
}: Props) {
    const [history, setHistory] = useState<ClinicalHistoryDetailResponse | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyFeedback, setHistoryFeedback] = useState<FeedbackMessage | null>(null);

    const historyForm = useForm<HistoryFormData>({
        resolver: zodResolver(historySchema),
        defaultValues: {
            documentTypeId: "",
            documentNumber: "",
        },
    });

    const onSubmitHistoryLookup = async (values: HistoryFormData) => {
        setHistory(null);
        setHistoryFeedback(null);
        const payload: LookupContext = {
            documentTypeId: Number(values.documentTypeId),
            documentNumber: values.documentNumber.trim(),
        };
        await onLookupAnimals(payload);
    };

    const handleViewHistory = async (animalId: number) => {
        if (!lookupContext) {
            setHistoryFeedback({
                tone: "error",
                text: "Primero verifica tu documento para cargar tus mascotas.",
            });
            return;
        }
        setHistoryLoading(true);
        setHistoryFeedback(null);
        try {
            const response = await PublicPortalService.getClinicalHistory({
                ...lookupContext,
                animalId,
            });
            setHistory(response);
            setHistoryFeedback({
                tone: "success",
                text: "Historial clínico actualizado.",
            });
        } catch (error) {
            setHistory(null);
            setHistoryFeedback({
                tone: "error",
                text: parseErrorMessage(error),
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    return (
        <section
            id="history"
            className="rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur"
        >
            <div className="flex flex-col gap-3">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Historial clínico</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                    Consulta el historial de tus animales con seguridad y en minutos.
                </h2>
                <p className="text-lg text-slate-300">
                    Ingresa los datos del titular, elige la mascota y revisa sus consultas, tratamientos
                    preventivos, hospitalizaciones y procedimientos recientes.
                </p>
            </div>

            <form
                onSubmit={historyForm.handleSubmit(onSubmitHistoryLookup)}
                className="mt-10 grid gap-6 md:grid-cols-[1fr_1fr_auto]"
            >
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-200">Tipo de documento</label>
                    <select
                        className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                        {...historyForm.register("documentTypeId")}
                    >
                        <option value="">Selecciona una opción</option>
                        {documentTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.abbreviation ?? type.name}
                            </option>
                        ))}
                    </select>
                    {historyForm.formState.errors.documentTypeId && (
                        <span className="text-xs text-rose-300">
                            {historyForm.formState.errors.documentTypeId.message}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-200">Número de documento</label>
                    <input
                        type="text"
                        maxLength={64}
                        className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                        placeholder="Ingresa el documento tal como está registrado"
                        {...historyForm.register("documentNumber")}
                    />
                    {historyForm.formState.errors.documentNumber && (
                        <span className="text-xs text-rose-300">
                            {historyForm.formState.errors.documentNumber.message}
                        </span>
                    )}
                </div>

                <button
                    type="submit"
                    className="self-end rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={animalsLoading}
                >
                    {animalsLoading ? "Buscando..." : "Buscar mascotas"}
                </button>
            </form>

            {lookupFeedback && (
                <div
                    className={`mt-6 rounded-xl border px-4 py-3 text-sm ${lookupFeedback.tone === "success"
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                        : "border-rose-400/40 bg-rose-500/10 text-rose-200"
                        }`}
                >
                    {lookupFeedback.text}
                </div>
            )}

            {animals.length > 0 && (
                <div className="mt-12 grid gap-6 md:grid-cols-2">
                    {animals.map((animal) => (
                        <div
                            key={animal.id}
                            className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-semibold text-white">{animal.name}</p>
                                    <p className="text-sm text-slate-300">
                                        {AnimalSpeciesLabels[animal.species] ?? animal.species}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleViewHistory(animal.id)}
                                    className="rounded-full border border-cyan-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 transition hover:border-cyan-200 hover:text-white"
                                >
                                    Ver historial
                                </button>
                            </div>
                            {animal.breed && (
                                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                                    Raza: {animal.breed}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {historyFeedback && (
                <div
                    className={`mt-8 rounded-xl border px-4 py-3 text-sm ${historyFeedback.tone === "success"
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                        : "border-rose-400/40 bg-rose-500/10 text-rose-200"
                        }`}
                >
                    {historyFeedback.text}
                </div>
            )}

            {historyLoading && (
                <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center text-sm text-slate-300">
                    Recuperando historial clínico...
                </div>
            )}

            {history && !historyLoading && (
                <div className="mt-10 grid gap-6 text-sm text-slate-200 lg:grid-cols-[1fr,1fr]">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                        <h3 className="text-xl font-semibold text-white">Perfil</h3>
                        <dl className="mt-4 space-y-3">
                            <div>
                                <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Nombre</dt>
                                <dd className="text-base text-white">{history.patient.name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Especie</dt>
                                <dd className="text-base text-white">
                                    {history.patient.speciesLabel ?? AnimalSpeciesLabels[history.patient.species] ?? history.patient.species}
                                </dd>
                            </div>
                            {history.patient.breed && (
                                <div>
                                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Raza</dt>
                                    <dd className="text-base text-white">{history.patient.breed}</dd>
                                </div>
                            )}
                            {history.patient.owner && (
                                <div>
                                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Responsable</dt>
                                    <dd className="text-base text-white">{history.patient.owner.name}</dd>
                                    {history.patient.owner.documentType && (
                                        <p className="text-xs text-slate-400">
                                            {history.patient.owner.documentType} · {history.patient.owner.documentNumber}
                                        </p>
                                    )}
                                </div>
                            )}
                        </dl>
                        {history.patient.lastVisitDate && (
                            <div className="mt-6 rounded-xl bg-emerald-500/10 p-4 text-emerald-200">
                                Última visita registrada: {formatDateTime(history.patient.lastVisitDate)}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                        <h3 className="text-xl font-semibold text-white">Última consulta</h3>
                        {history.lastConsultation ? (
                            <div className="mt-4 space-y-3">
                                <p className="text-sm text-slate-300">
                                    {formatDateTime(history.lastConsultation.visitDate)} · {history.lastConsultation.branchName}
                                </p>
                                {history.lastConsultation.clinicalServiceName && (
                                    <p className="text-base text-white">
                                        Motivo: {history.lastConsultation.clinicalServiceName}
                                    </p>
                                )}
                                {history.lastConsultation.veterinarian && (
                                    <p className="text-sm text-slate-300">
                                        Profesional: {history.lastConsultation.veterinarian}
                                    </p>
                                )}
                                {history.lastConsultation.reasonForVisit && (
                                    <p className="text-sm text-slate-300">
                                        Detalle: {history.lastConsultation.reasonForVisit}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-300">
                                Aún no registramos consultas para esta mascota. Agenda una cita y empecemos su historial.
                            </p>
                        )}
                    </div>

                    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-white">Consultas recientes</h3>
                            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                {history.consultations.length} registros
                            </span>
                        </div>
                        {history.consultations.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-300">
                                No tenemos visitas registradas. Nuestro equipo está listo para recibirlos cuando lo necesites.
                                Read me
                            </p>
                        ) : (
                            <div className="mt-6 space-y-4">
                                {history.consultations.slice(0, 4).map((consultation) => (
                                    <div
                                        key={consultation.id}
                                        className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
                                    >
                                        <div className="flex flex-wrap justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                                            <span>{formatDateTime(consultation.visitDate)}</span>
                                            {consultation.branchName && <span>{consultation.branchName}</span>}
                                        </div>
                                        <p className="mt-3 text-base text-white">
                                            {consultation.clinicalServiceName ?? "Consulta veterinaria"}
                                        </p>
                                        {consultation.reasonForVisit && (
                                            <p className="mt-2 text-slate-300">{consultation.reasonForVisit}</p>
                                        )}
                                        {consultation.veterinarian && (
                                            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-cyan-200">
                                                {consultation.veterinarian}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}