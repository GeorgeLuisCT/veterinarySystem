"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import {
  CalendarHeart,
  Dog,
  HeartPulse,
  MapPin,
  Phone,
  Stethoscope,
  Sun,
  Syringe,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import DocumentTypeService from "@/app/dashboard/crm/customers/service/DocumentTypeService";
import type { DocumentTypeResponse } from "@/app/dashboard/crm/customers/types/document-type-response";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { AppointmentType, AppointmentTypeLabels } from "@/app/dashboard/schedule/enums/appointment-type";
import { AnimalSpeciesLabels } from "@/app/dashboard/crm/patients/enums/animal-species";
import type { ClinicalHistoryDetailResponse } from "@/app/dashboard/clinical/types/medical-history-response";
import PublicPortalService from "@/services/public-portal-service";
import type {
  PublicAnimalSummary,
  PublicAppointmentRequestPayload,
} from "@/services/public-portal.types";

type LookupContext = {
  documentTypeId: number;
  documentNumber: string;
};

const historySchema = z.object({
  documentTypeId: z.string().min(1, "Selecciona un tipo de documento"),
  documentNumber: z.string().trim().min(4, "Ingresa un documento válido"),
});

type HistoryFormData = z.infer<typeof historySchema>;

const optionalEmailSchema = z
  .union([z.string().trim().email("Correo inválido"), z.literal("")])
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalPhoneSchema = z
  .union([z.string().trim().min(7, "Número muy corto"), z.literal("")])
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const appointmentSchema = z.object({
  documentTypeId: z.string().min(1, "Selecciona un tipo de documento"),
  documentNumber: z.string().trim().min(4, "Ingresa un documento válido"),
  animalId: z.string().min(1, "Selecciona a tu mascota"),
  branchId: z.string().min(1, "Selecciona una sede"),
  appointmentType: z.nativeEnum(AppointmentType, {
    errorMap: () => ({ message: "Selecciona el tipo de cita" }),
  }),
  preferredDate: z.string().min(1, "Selecciona la fecha de tu cita"),
  preferredTime: z.string().min(1, "Selecciona la hora"),
  requesterName: z.string().trim().min(3, "Cuéntanos quién agenda la cita"),
  requesterEmail: optionalEmailSchema,
  requesterPhone: optionalPhoneSchema,
  notes: z
    .string()
    .trim()
    .max(600, "Máximo 600 caracteres")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface FeedbackMessage {
  tone: "success" | "error";
  text: string;
}

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

function parseErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiMessage = error.response?.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
      return apiMessage;
    }
    if (typeof error.message === "string") {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocurrió un error inesperado. Inténtalo nuevamente.";
}

function formatDate(value?: string | null, pattern = "dd 'de' MMMM yyyy"): string {
  if (!value) {
    return "Sin registrar";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return format(date, pattern, { locale: es });
}

function formatDateTime(value?: string | null): string {
  return formatDate(value, "dd 'de' MMMM yyyy, HH:mm 'h'");
}

function buildLocalDateTime(date: string, time: string): string {
  const composed = `${date}T${time}`;
  const check = new Date(composed);
  if (Number.isNaN(check.getTime())) {
    return composed;
  }
  const year = check.getFullYear();
  const month = `${check.getMonth() + 1}`.padStart(2, "0");
  const day = `${check.getDate()}`.padStart(2, "0");
  const hours = `${check.getHours()}`.padStart(2, "0");
  const minutes = `${check.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

export function PublicLandingPage() {
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [animals, setAnimals] = useState<PublicAnimalSummary[]>([]);
  const [lookupContext, setLookupContext] = useState<LookupContext | null>(null);
  const [history, setHistory] = useState<ClinicalHistoryDetailResponse | null>(null);
  const [animalsLoading, setAnimalsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<FeedbackMessage | null>(null);
  const [historyFeedback, setHistoryFeedback] = useState<FeedbackMessage | null>(null);
  const [appointmentFeedback, setAppointmentFeedback] = useState<FeedbackMessage | null>(null);
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false);

  const historyForm = useForm<HistoryFormData>({
    resolver: zodResolver(historySchema),
    defaultValues: {
      documentTypeId: "",
      documentNumber: "",
    },
  });

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

  useEffect(() => {
    DocumentTypeService.getDocumentTypes()
      .then(setDocumentTypes)
      .catch(() => setDocumentTypes([]));
    PublicPortalService.listBranches()
      .then(setBranches)
      .catch(() => setBranches([]));
  }, []);

  const appointmentTypeOptions = useMemo(
    () =>
      (Object.values(AppointmentType) as AppointmentType[]).map((value) => ({
        value,
        label: AppointmentTypeLabels[value],
      })),
    [],
  );

  const handleLookupAnimals = useCallback(
    async (payload: LookupContext) => {
      setAnimalsLoading(true);
      setLookupFeedback(null);
      setHistory(null);
      setHistoryFeedback(null);
      try {
        const list = await PublicPortalService.findAnimals(
          payload.documentTypeId,
          payload.documentNumber,
        );
        setAnimals(list);
        setLookupContext(payload);
        if (list.length === 0) {
          setLookupFeedback({
            tone: "error",
            text: "No encontramos mascotas activas asociadas a este documento.",
          });
        } else {
          setLookupFeedback({
            tone: "success",
            text: "Mascotas encontradas. Elige cuál deseas consultar.",
          });
        }
      } catch (error) {
        setLookupFeedback({
          tone: "error",
          text: parseErrorMessage(error),
        });
        setAnimals([]);
        setLookupContext(null);
      } finally {
        setAnimalsLoading(false);
      }
    },
    [],
  );

  const onSubmitHistoryLookup = async (values: HistoryFormData) => {
    const payload: LookupContext = {
      documentTypeId: Number(values.documentTypeId),
      documentNumber: values.documentNumber.trim(),
    };
    await handleLookupAnimals(payload);
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
    await handleLookupAnimals({
      documentTypeId: Number(parsed.data.documentTypeId),
      documentNumber: parsed.data.documentNumber.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-100 text-slate-100">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%)]" />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 md:px-10 lg:px-16">
          <nav className="flex items-center justify-between text-sm font-medium uppercase tracking-[0.2em] text-slate-300">
            <span className="flex items-center gap-2 text-slate-100">
              <Dog className="h-6 w-6 text-cyan-300" />
              BiocampoVet
            </span>
            <div className="flex items-center gap-6">
              <Link href="#services" className="transition hover:text-white">
                Servicios
              </Link>
              <Link href="#history" className="transition hover:text-white">
                Historial
              </Link>
              <Link href="#appointment" className="transition hover:text-white">
                Solicitar cita
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-cyan-400/60 px-4 py-2 text-cyan-200 transition hover:border-cyan-200 hover:text-white"
              >
                Ingreso personal
              </Link>
            </div>
          </nav>

          <section className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
            <div className="flex flex-col gap-8">
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Cuidado animal integral
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Un hogar de salud para cada mascota, con tecnología que inspira confianza.
              </h1>
              <p className="max-w-xl text-lg text-slate-300">
                Somos un equipo apasionado por el bienestar de los animales. Desde el primer chequeo hasta
                tratamientos especializados, guiamos a las familias con transparencia, empatía y una visión moderna de la medicina veterinaria.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="#appointment"
                  className="rounded-full bg-cyan-400 px-8 py-3 text-center text-base font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-300"
                >
                  Agenda tu cita
                </Link>
                <Link
                  href="#history"
                  className="rounded-full border border-slate-500 px-8 py-3 text-center text-base font-semibold text-slate-200 transition hover:border-slate-300 hover:text-white"
                >
                  Consulta historial
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <p className="text-3xl font-semibold text-white">15+</p>
                  <p className="text-sm text-slate-300">Especialistas en medicina preventiva, clínica y quirúrgica.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <p className="text-3xl font-semibold text-white">24/7</p>
                  <p className="text-sm text-slate-300">Atención de emergencias y monitoreo continuo.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <p className="text-3xl font-semibold text-white">+1.200</p>
                  <p className="text-sm text-slate-300">Familias que confían en nosotros para el cuidado de sus animales.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-8 backdrop-blur">
              <div className="flex flex-col gap-6 text-sm text-slate-200">
                <div className="rounded-2xl bg-white/5 p-6">
                  <div className="flex items-center gap-3">
                    <Sun className="h-8 w-8 text-amber-300" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Ambiente calmado</p>
                      <p className="text-base text-white">
                        Habitaciones con aromas relajantes, música suave y luz natural para minimizar el estrés.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 p-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-cyan-300" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Comunidad</p>
                      <p className="text-base text-white">
                        Talleres, charlas y experiencias educativas para tutores responsables y felices.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 p-6">
                  <div className="flex items-center gap-3">
                    <HeartPulse className="h-8 w-8 text-rose-300" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-rose-200">Compromiso</p>
                      <p className="text-base text-white">
                        Protocolos centrados en el bienestar y recuperación segura de cada paciente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-32 px-6 py-24 md:px-10 lg:px-16">
        <section id="services" className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Servicios con propósito
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Tecnología, calidez humana y planes personalizados para cada etapa de vida.
            </h2>
            <p className="text-lg text-slate-300">
              Integramos historias clínicas digitales, monitoreo remoto y comunicación constante con la familia
              para acompañar a cada mascota en un camino de salud preventivo y proactivo.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <Stethoscope className="mb-4 h-8 w-8 text-cyan-300" />
                <h3 className="text-lg font-semibold text-white">Diagnóstico avanzado</h3>
                <p className="text-sm text-slate-300">
                  Laboratorio propio, imagenología y telemetría para decisiones rápidas y precisas.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <CalendarHeart className="mb-4 h-8 w-8 text-fuchsia-300" />
                <h3 className="text-lg font-semibold text-white">Planes preventivos</h3>
                <p className="text-sm text-slate-300">
                  Esquemas de vacunación, desparasitación y chequeos adaptados al estilo de vida de tu compañero.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <Syringe className="mb-4 h-8 w-8 text-emerald-300" />
                <h3 className="text-lg font-semibold text-white">Cirugías seguras</h3>
                <p className="text-sm text-slate-300">
                  Quirófanos equipados, protocolos anestésicos personalizados y monitoreo continuo.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <HeartPulse className="mb-4 h-8 w-8 text-rose-300" />
                <h3 className="text-lg font-semibold text-white">Rehabilitación</h3>
                <p className="text-sm text-slate-300">
                  Fisioterapia, masoterapia y planes de ejercicio para recuperar movilidad y vitalidad.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur">
            <h3 className="text-xl font-semibold text-white">¿Por qué elegirnos?</h3>
            <ul className="mt-6 space-y-5 text-sm text-slate-200">
              <li className="flex gap-3">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-cyan-300" />
                Acceso en línea a la historia clínica, recordatorios y resultados.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-cyan-300" />
                Equipo interdisciplinario con formación constante y vocación de servicio.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-cyan-300" />
                Protocolos Fear Free para reducir el estrés en cada visita.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-cyan-300" />
                Programas de bienestar rural y atención a grandes especies.
              </li>
            </ul>
          </div>
        </section>

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
              className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                lookupFeedback.tone === "success"
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
              className={`mt-8 rounded-xl border px-4 py-3 text-sm ${
                historyFeedback.tone === "success"
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

        <section
          id="appointment"
          className="grid gap-10 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-slate-950 p-10 backdrop-blur lg:grid-cols-[1fr,1fr]"
        >
          <div className="flex flex-col gap-6 text-slate-200">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Solicita tu cita</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Reserva en línea y nos encargamos del resto.
            </h2>
            <p className="text-lg text-slate-300">
              Nuestro equipo revisará tu solicitud, validará la disponibilidad y te contactará por el medio que prefieras
              para confirmar los últimos detalles.
            </p>
            <div className="grid gap-4">
              {appointmentIllustrations.map((item) => (
                <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <item.icon className="h-8 w-8 text-cyan-300" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-slate-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
            <form className="flex flex-col gap-5" onSubmit={appointmentForm.handleSubmit(onSubmitAppointment)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Tipo de documento
                  </label>
                  <select
                    className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
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
                    <span className="text-xs text-rose-300">
                      {appointmentForm.formState.errors.documentTypeId.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Número de documento
                  </label>
                  <input
                    type="text"
                    maxLength={64}
                    className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                    {...appointmentForm.register("documentNumber")}
                  />
                  {appointmentForm.formState.errors.documentNumber && (
                    <span className="text-xs text-rose-300">
                      {appointmentForm.formState.errors.documentNumber.message}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLoadAnimalsFromAppointment}
                className="w-full rounded-xl border border-cyan-400/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200 transition hover:border-cyan-200 hover:text-white"
                disabled={animalsLoading}
              >
                {animalsLoading ? "Consultando..." : "Cargar mis mascotas"}
              </button>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Mascota
                </label>
                <select
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
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
                  <span className="text-xs text-rose-300">
                    {appointmentForm.formState.errors.animalId.message}
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Sede</label>
                  <select
                    className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
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
                    <span className="text-xs text-rose-300">
                      {appointmentForm.formState.errors.branchId.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Tipo de cita</label>
                  <select
                    className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                    {...appointmentForm.register("appointmentType")}
                  >
                    {appointmentTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {appointmentForm.formState.errors.appointmentType && (
                    <span className="text-xs text-rose-300">
                      {appointmentForm.formState.errors.appointmentType.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Fecha</label>
                  <input
                    type="date"
                    className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                    {...appointmentForm.register("preferredDate")}
                  />
                  {appointmentForm.formState.errors.preferredDate && (
                    <span className="text-xs text-rose-300">
                      {appointmentForm.formState.errors.preferredDate.message}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Hora</label>
                  <input
                    type="time"
                    className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                    {...appointmentForm.register("preferredTime")}
                  />
                  {appointmentForm.formState.errors.preferredTime && (
                    <span className="text-xs text-rose-300">
                      {appointmentForm.formState.errors.preferredTime.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Nombre de contacto
                </label>
                <input
                  type="text"
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                  placeholder="¿Quién solicita la cita?"
                  {...appointmentForm.register("requesterName")}
                />
                {appointmentForm.formState.errors.requesterName && (
                  <span className="text-xs text-rose-300">
                    {appointmentForm.formState.errors.requesterName.message}
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                    {...appointmentForm.register("requesterEmail")}
                  />
                  {appointmentForm.formState.errors.requesterEmail && (
                    <span className="text-xs text-rose-300">
                      {appointmentForm.formState.errors.requesterEmail.message}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Teléfono o WhatsApp
                  </label>
                  <input
                    type="tel"
                    className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                    {...appointmentForm.register("requesterPhone")}
                  />
                  {appointmentForm.formState.errors.requesterPhone && (
                    <span className="text-xs text-rose-300">
                      {appointmentForm.formState.errors.requesterPhone.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Notas adicionales
                </label>
                <textarea
                  rows={4}
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                  placeholder="Cuéntanos si existe alguna preferencia, restricción o tratamiento en curso."
                  {...appointmentForm.register("notes")}
                />
                {appointmentForm.formState.errors.notes && (
                  <span className="text-xs text-rose-300">
                    {appointmentForm.formState.errors.notes.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="mt-4 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={appointmentSubmitting}
              >
                {appointmentSubmitting ? "Enviando solicitud..." : "Enviar solicitud"}
              </button>

              {appointmentFeedback && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    appointmentFeedback.tone === "success"
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                      : "border-rose-400/40 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  {appointmentFeedback.text}
                </div>
              )}
            </form>
          </div>
        </section>

        <section className="grid gap-10 rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Ubicaciones</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Tres sedes conectadas con el campo y la ciudad.
            </h2>
            <p className="text-lg text-slate-300">
              Cada sede está diseñada para crear experiencias tranquilas: salas separadas por especie, jardines sensoriales y
              espacios de espera al aire libre para disminuir la ansiedad de los animales.
            </p>
            <div className="mt-6 grid gap-4 text-sm text-slate-200">
              {branches.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  Estamos actualizando la información de nuestras sedes. Contáctanos y te guiaremos personalmente.
                </p>
              ) : (
                branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/10 p-4"
                  >
                    <MapPin className="mt-1 h-6 w-6 flex-none text-cyan-300" />
                    <div>
                      <h3 className="text-base font-semibold text-white">{branch.name}</h3>
                      <p className="text-sm text-slate-300">{branch.location}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                        Atención previa cita
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-slate-200">
            <h3 className="text-xl font-semibold text-white">¿Necesitas hablar con alguien?</h3>
            <p className="mt-3 text-sm text-slate-300">
              Nuestro equipo de bienestar animal te orienta sobre programas preventivos, planes corporativos y atención a tu medida.
            </p>
            <div className="mt-6 space-y-4">
              <a
                href="tel:+573001234567"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:border-cyan-300 hover:text-white"
              >
                <Phone className="h-5 w-5 text-cyan-300" />
                +57 300 123 4567
              </a>
              <a
                href="mailto:contacto@biocampovet.com"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:border-cyan-300 hover:text-white"
              >
                <HeartPulse className="h-5 w-5 text-rose-300" />
                contacto@biocampovet.com
              </a>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-500">
              Emergencias 24/7 · Traslado asistido disponible
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
          <p>© {new Date().getFullYear()} BiocampoVet. Crecemos junto a quienes cuidan la vida.</p>
          <div className="flex items-center gap-6">
            <Link href="#services" className="transition hover:text-white">
              Servicios
            </Link>
            <Link href="#history" className="transition hover:text-white">
              Historial
            </Link>
            <Link href="#appointment" className="transition hover:text-white">
              Citas
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLandingPage;
