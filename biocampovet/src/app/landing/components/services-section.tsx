import { CalendarHeart, HeartPulse, Stethoscope, Syringe } from "lucide-react";

export function ServicesSection() {
  return (
    <section id="services" className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
      <div className="flex flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700/80">
          Servicios con propósito
        </p>
        <h2 className="text-3xl font-semibold text-slate-700 sm:text-4xl">
          Tecnología, calidez humana y planes personalizados para cada etapa de vida.
        </h2>
        <p className="text-lg text-slate-600">
          Integramos historias clínicas digitales, monitoreo remoto y comunicación constante con la familia
          para acompañar a cada mascota en un camino de salud preventivo y proactivo.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <Stethoscope className="mb-4 h-8 w-8 text-sky-600" />
            <h3 className="text-lg font-semibold text-slate-700">Diagnóstico avanzado</h3>
            <p className="text-sm text-slate-600">
              Laboratorio propio, imagenología y telemetría para decisiones rápidas y precisas.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <CalendarHeart className="mb-4 h-8 w-8 text-fuchsia-500" />
            <h3 className="text-lg font-semibold text-slate-700">Planes preventivos</h3>
            <p className="text-sm text-slate-600">
              Esquemas de vacunación, desparasitación y chequeos adaptados al estilo de vida de tu compañero.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <Syringe className="mb-4 h-8 w-8 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-700">Cirugías seguras</h3>
            <p className="text-sm text-slate-600">
              Quirófanos equipados, protocolos anestésicos personalizados y monitoreo continuo.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <HeartPulse className="mb-4 h-8 w-8 text-rose-500" />
            <h3 className="text-lg font-semibold text-slate-700">Rehabilitación</h3>
            <p className="text-sm text-slate-600">
              Fisioterapia, masoterapia y planes de ejercicio para recuperar movilidad y vitalidad.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-700">¿Por qué elegirnos?</h3>
        <ul className="mt-6 space-y-5 text-sm text-slate-700">
          <li className="flex gap-3">
            <span className="mt-2 inline-block h-2 w-2 rounded-full bg-sky-400" />
            Acceso en línea a la historia clínica, recordatorios y resultados.
          </li>
          <li className="flex gap-3">
            <span className="mt-2 inline-block h-2 w-2 rounded-full bg-sky-400" />
            Equipo interdisciplinario con formación constante y vocación de servicio.
          </li>
          <li className="flex gap-3">
            <span className="mt-2 inline-block h-2 w-2 rounded-full bg-sky-400" />
            Protocolos Fear Free para reducir el estrés en cada visita.
          </li>
          <li className="flex gap-3">
            <span className="mt-2 inline-block h-2 w-2 rounded-full bg-sky-400" />
            Programas de bienestar rural y atención a grandes especies.
          </li>
        </ul>
      </div>
    </section>
  );
}
