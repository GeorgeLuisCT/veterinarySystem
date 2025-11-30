"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HeartPulse, Stethoscope, Syringe } from "lucide-react";

import type { DocumentTypeResponse } from "@/app/dashboard/crm/customers/types/document-type-response";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { AppointmentType, AppointmentTypeLabels } from "@/app/dashboard/schedule/enums/appointment-type";
import { AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";
import PublicPortalService from "@/app/landing/service/public-portal-service";
import type {
  PublicAnimalSummary,
  PublicAppointmentRequestPayload,
} from "@/app/landing/types/public-portal.types";

import { buildLocalDateTime, parseErrorMessage } from "../utils/helpers";
import { FeedbackMessage, LookupContext } from "./public-landing-page";
import { AppointmentFormData, appointmentSchema } from "../types/schemas";

const appointmentIllustrations = [
  {
    icon: Stethoscope,
    title: "Consultas generales",
    description: "Diagnóstico integral y seguimiento personalizado para cada paciente.",
  },
  {
    icon: Syringe,
    title: "Vacunación y prevención",
    description: "Protocolos de prevención actualizados y recordatorios automáticos.",
  },
  {
    icon: HeartPulse,
    title: "Urgencias 24/7",
    description: "Equipo listo para estabilizar a tu mascota cuando lo necesitas.",
  },
];

interface Props {
  documentTypes: DocumentTypeResponse[];
  branches: BranchResponse[];
  animals: PublicAnimalSummary[];
  animalsLoading: boolean;
  onLookupAnimals: (payload: LookupContext) => Promise<void>;
}

export function AppointmentRequestSection({
  documentTypes,
  branches,
  animals,
  animalsLoading,
  onLookupAnimals,
}: Props) {
  const [appointmentFeedback, setAppointmentFeedback] = useState<FeedbackMessage | null>(null);
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false);

  const appointmentForm = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      documentTypeId: "",
      documentNumber: "",
      animalId: "",
      branchId: "",
      appointmentType: AppointmentType.CLINIC,
      preferredDate: "",
      preferredTime: "",
      requesterName: "",
      requesterEmail: "",
      requesterPhone: "",
      notes: "",
    },
  });

  const appointmentTypeOptions = useMemo(
    () =>
      (Object.values(AppointmentType) as AppointmentType[]).map((value) => ({
        value,
        label: AppointmentTypeLabels[value],
      })),
    [],
  );

  const onSubmitAppointment = async (values: AppointmentFormData) => {
    setAppointmentFeedback(null);
    setAppointmentSubmitting(true);
    try {
      const payload: PublicAppointmentRequestPayload = {
        documentTypeId: Number(values.documentTypeId),
        documentNumber: values.documentNumber.trim(),
        animalId: Number(values.animalId),
        branchId: Number(values.branchId),
        type: values.appointmentType,
        preferredDateTime: buildLocalDateTime(values.preferredDate, values.preferredTime),
        estimatedDurationMinutes: 30,
        requesterName: values.requesterName.trim(),
        requesterEmail: values.requesterEmail,
        requesterPhone: values.requesterPhone,
        notes: values.notes,
      };

      const response = await PublicPortalService.requestAppointment(payload);

      setAppointmentFeedback({
        tone: "success",
        text: `Recibimos tu solicitud para ${response.animalName} en la sede ${response.branchName}. Te contactaremos para confirmarla.`,
      });
      appointmentForm.reset({
        documentTypeId: values.documentTypeId,
        documentNumber: values.documentNumber,
        animalId: "",
        branchId: "",
        appointmentType: values.appointmentType,
        preferredDate: "",
        preferredTime: "",
        requesterName: "",
        requesterEmail: "",
        requesterPhone: "",
        notes: "",
      });
    } catch (error) {
      setAppointmentFeedback({
        tone: "error",
        text: parseErrorMessage(error),
      });
    } finally {
      setAppointmentSubmitting(false);
    }
  };

  const handleLoadAnimalsFromAppointment = async () => {
    const values = appointmentForm.getValues();
    const parsed = appointmentSchema.pick({ documentTypeId: true, documentNumber: true }).safeParse({
      documentTypeId: values.documentTypeId,
      documentNumber: values.documentNumber,
    });
    if (!parsed.success) {
      appointmentForm.trigger(["documentTypeId", "documentNumber"]);
      return;
    }
    await onLookupAnimals({
      documentTypeId: Number(parsed.data.documentTypeId),
      documentNumber: parsed.data.documentNumber.trim(),
    });
  };

  return (
    <section
      id="appointment"
      className="grid gap-10 rounded-[2.5rem] border border-slate-200 bg-white/90 p-10 shadow-sm lg:grid-cols-[1fr,1fr]"
    >
      {/* Columna izquierda: texto + ilustraciones en pastel */}
      <div className="flex flex-col gap-6 text-slate-700">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-700/80">Solicita tu cita</p>
        <h2 className="text-3xl font-semibold sm:text-4xl">
          Reserva en línea y nos encargamos del resto.
        </h2>
        <p className="text-lg text-slate-600">
          Nuestro equipo revisará tu solicitud, validará la disponibilidad y te contactará por el medio que prefieras
          para confirmar los últimos detalles.
        </p>

        <div className="grid gap-4">
          {appointmentIllustrations.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl bg-sky-50 p-5 ring-1 ring-inset ring-sky-100"
            >
              <item.icon className="h-8 w-8 text-sky-600" />
              <div>
                <h3 className="text-lg font-semibold text-slate-700">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Columna derecha: formulario pastel */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <form className="flex flex-col gap-5" onSubmit={appointmentForm.handleSubmit(onSubmitAppointment)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Tipo de documento
              </label>
              <select
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                {...appointmentForm.register("documentTypeId")}
              >
                <option value="">Selecciona una opción</option>
                {documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.abbreviation ?? type.name}
                  </option>
                ))}
              </select>
              {appointmentForm.formState.errors.documentTypeId && (
                <span className="text-xs text-rose-600">
                  {appointmentForm.formState.errors.documentTypeId.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Número de documento
              </label>
              <input
                type="text"
                maxLength={64}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                {...appointmentForm.register("documentNumber")}
              />
              {appointmentForm.formState.errors.documentNumber && (
                <span className="text-xs text-rose-600">
                  {appointmentForm.formState.errors.documentNumber.message}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLoadAnimalsFromAppointment}
            className="w-full rounded-xl bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 ring-1 ring-inset ring-sky-300 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={animalsLoading}
          >
            {animalsLoading ? "Consultando..." : "Cargar mis mascotas"}
          </button>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Mascota</label>
            <select
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
              {...appointmentForm.register("animalId")}
            >
              <option value="">Selecciona a quién atenderemos</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.name} · {AnimalSpeciesLabels[animal.species] ?? animal.species}
                </option>
              ))}
            </select>
            {appointmentForm.formState.errors.animalId && (
              <span className="text-xs text-rose-600">
                {appointmentForm.formState.errors.animalId.message}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Sede</label>
              <select
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                {...appointmentForm.register("branchId")}
              >
                <option value="">Selecciona la sede ideal</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {appointmentForm.formState.errors.branchId && (
                <span className="text-xs text-rose-600">
                  {appointmentForm.formState.errors.branchId.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Tipo de cita</label>
              <select
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                {...appointmentForm.register("appointmentType")}
              >
                {appointmentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {appointmentForm.formState.errors.appointmentType && (
                <span className="text-xs text-rose-600">
                  {appointmentForm.formState.errors.appointmentType.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Fecha</label>
              <input
                type="date"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                {...appointmentForm.register("preferredDate")}
              />
              {appointmentForm.formState.errors.preferredDate && (
                <span className="text-xs text-rose-600">
                  {appointmentForm.formState.errors.preferredDate.message}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Hora</label>
              <input
                type="time"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                {...appointmentForm.register("preferredTime")}
              />
              {appointmentForm.formState.errors.preferredTime && (
                <span className="text-xs text-rose-600">
                  {appointmentForm.formState.errors.preferredTime.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Nombre de contacto
            </label>
            <input
              type="text"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
              placeholder="¿Quién solicita la cita?"
              {...appointmentForm.register("requesterName")}
            />
            {appointmentForm.formState.errors.requesterName && (
              <span className="text-xs text-rose-600">
                {appointmentForm.formState.errors.requesterName.message}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Correo electrónico
              </label>
              <input
                type="email"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                {...appointmentForm.register("requesterEmail")}
              />
              {appointmentForm.formState.errors.requesterEmail && (
                <span className="text-xs text-rose-600">
                  {appointmentForm.formState.errors.requesterEmail.message}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Teléfono o WhatsApp
              </label>
              <input
                type="tel"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                {...appointmentForm.register("requesterPhone")}
              />
              {appointmentForm.formState.errors.requesterPhone && (
                <span className="text-xs text-rose-600">
                  {appointmentForm.formState.errors.requesterPhone.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Notas adicionales
            </label>
            <textarea
              rows={4}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
              placeholder="Cuéntanos si existe alguna preferencia, restricción o tratamiento en curso."
              {...appointmentForm.register("notes")}
            />
            {appointmentForm.formState.errors.notes && (
              <span className="text-xs text-rose-600">
                {appointmentForm.formState.errors.notes.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-sky-200 px-6 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={appointmentSubmitting}
          >
            {appointmentSubmitting ? "Enviando solicitud..." : "Enviar solicitud"}
          </button>

          {appointmentFeedback && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                appointmentFeedback.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {appointmentFeedback.text}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
