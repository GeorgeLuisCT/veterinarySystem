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
      className="rounded-[2.5rem] border border-slate-200 bg-white/90 p-10 shadow-sm"
    >
      {/* Encabezado */}
      <div className="flex flex-col gap-3">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-700/80">Historial clínico</p>
        <h2 className="text-3xl font-semibold text-slate-700 sm:text-4xl">
          Consulta el historial de tus animales con seguridad y en minutos.
        </h2>
        <p className="text-lg text-slate-600">
          Ingresa los datos del titular, elige la mascota y revisa sus consultas, tratamientos
          preventivos, hospitalizaciones y procedimientos recientes.
        </p>
      </div>

      {/* Formulario */}
      <form
        onSubmit={historyForm.handleSubmit(onSubmitHistoryLookup)}
        className="mt-10 grid gap-6 md:grid-cols-[1fr_1fr_auto]"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Tipo de documento</label>
          <select
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
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
            <span className="text-xs text-rose-600">
              {historyForm.formState.errors.documentTypeId.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Número de documento</label>
          <input
            type="text"
            maxLength={64}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
            placeholder="Ingresa el documento tal como está registrado"
            {...historyForm.register("documentNumber")}
          />
          {historyForm.formState.errors.documentNumber && (
            <span className="text-xs text-rose-600">
              {historyForm.formState.errors.documentNumber.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="self-end rounded-xl bg-sky-200 px-6 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={animalsLoading}
        >
          {animalsLoading ? "Buscando..." : "Buscar mascotas"}
        </button>
      </form>

      {/* Feedback búsqueda */}
      {lookupFeedback && (
        <div
          className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
            lookupFeedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {lookupFeedback.text}
        </div>
      )}

      {/* Lista de mascotas */}
      {animals.length > 0 && (
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {animals.map((animal) => (
            <div
              key={animal.id}
              className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-700">{animal.name}</p>
                  <p className="text-sm text-slate-600">
                    {AnimalSpeciesLabels[animal.species] ?? animal.species}
                  </p>
                </div>
                <button
                  onClick={() => handleViewHistory(animal.id)}
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 ring-1 ring-inset ring-sky-300 transition hover:bg-sky-50"
                >
                  Ver historial
                </button>
              </div>
              {animal.breed && (
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Raza: {animal.breed}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feedback historial */}
      {historyFeedback && (
        <div
          className={`mt-8 rounded-xl border px-4 py-3 text-sm ${
            historyFeedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {historyFeedback.text}
        </div>
      )}

      {/* Loading historial */}
      {historyLoading && (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white/90 p-8 text-center text-sm text-slate-600 shadow-sm">
          Recuperando historial clínico...
        </div>
      )}

      {/* Detalle de historial */}
      {history && !historyLoading && (
        <div className="mt-10 grid gap-6 text-sm text-slate-700 lg:grid-cols-[1fr,1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-700">Perfil</h3>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Nombre</dt>
                <dd className="text-base text-slate-700">{history.patient.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Especie</dt>
                <dd className="text-base text-slate-700">
                  {history.patient.speciesLabel ??
                    AnimalSpeciesLabels[history.patient.species] ??
                    history.patient.species}
                </dd>
              </div>
              {history.patient.breed && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Raza</dt>
                  <dd className="text-base text-slate-700">{history.patient.breed}</dd>
                </div>
              )}
              {history.patient.owner && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Responsable</dt>
                  <dd className="text-base text-slate-700">{history.patient.owner.name}</dd>
                  {history.patient.owner.documentType && (
                    <p className="text-xs text-slate-500">
                      {history.patient.owner.documentType} · {history.patient.owner.documentNumber}
                    </p>
                  )}
                </div>
              )}
            </dl>
            {history.patient.lastVisitDate && (
              <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                Última visita registrada: {formatDateTime(history.patient.lastVisitDate)}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-700">Última consulta</h3>
            {history.lastConsultation ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-600">
                  {formatDateTime(history.lastConsultation.visitDate)} · {history.lastConsultation.branchName}
                </p>
                {history.lastConsultation.clinicalServiceName && (
                  <p className="text-base text-slate-700">
                    Motivo: {history.lastConsultation.clinicalServiceName}
                  </p>
                )}
                {history.lastConsultation.veterinarian && (
                  <p className="text-sm text-slate-600">
                    Profesional: {history.lastConsultation.veterinarian}
                  </p>
                )}
                {history.lastConsultation.reasonForVisit && (
                  <p className="text-sm text-slate-600">
                    Detalle: {history.lastConsultation.reasonForVisit}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Aún no registramos consultas para esta mascota. Agenda una cita y empecemos su historial.
              </p>
            )}
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-700">Consultas recientes</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {history.consultations.length} registros
              </span>
            </div>

            {history.consultations.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                No tenemos visitas registradas. Nuestro equipo está listo para recibirlos cuando lo necesites.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {history.consultations.slice(0, 4).map((consultation) => (
                  <div
                    key={consultation.id}
                    className="rounded-xl border border-slate-200 bg-sky-50 p-4 text-sm text-slate-700 ring-1 ring-inset ring-sky-100"
                  >
                    <div className="flex flex-wrap justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{formatDateTime(consultation.visitDate)}</span>
                      {consultation.branchName && <span>{consultation.branchName}</span>}
                    </div>
                    <p className="mt-3 text-base text-slate-700">
                      {consultation.clinicalServiceName ?? "Consulta veterinaria"}
                    </p>
                    {consultation.reasonForVisit && (
                      <p className="mt-2 text-slate-600">{consultation.reasonForVisit}</p>
                    )}
                    {consultation.veterinarian && (
                      <p className="mt-2 text-xs uppercase tracking-[0.3em] text-sky-700/80">
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
