import { CalendarHeart, HeartPulse, Stethoscope, Syringe } from "lucide-react";

export function ServicesSection() {
    return (
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
    );
}