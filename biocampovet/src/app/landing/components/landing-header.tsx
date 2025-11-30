"use client";

import Link from "next/link";
import { Dog, HeartPulse, Sun, Users } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="relative overflow-hidden">
      {/* halo suave en celeste pastel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_60%)]" />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-16 px-6 pb-20 pt-12 md:px-10 lg:px-16">
        {/* NAV pastel */}
        <nav className="flex items-center justify-between text-sm font-medium uppercase tracking-[0.2em] text-slate-600">
          <span className="flex items-center gap-2 text-slate-700">
            <Dog className="h-6 w-6 text-sky-600" />
            Coryvet
          </span>
          <div className="flex items-center gap-6">
            <Link href="#services" className="transition hover:text-slate-900">
              Servicios
            </Link>
            <Link href="#history" className="transition hover:text-slate-900">
              Historial
            </Link>
            <Link href="#appointment" className="transition hover:text-slate-900">
              Solicitar cita
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-sky-300/70 bg-white px-4 py-2 text-slate-700 shadow-sm transition hover:border-sky-400 hover:bg-sky-50"
            >
              Ingreso personal
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
          <div className="flex flex-col gap-8">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-sky-700/80">
              Cuidado animal integral
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-700 sm:text-5xl lg:text-6xl">
              Un hogar de salud para cada mascota, con tecnología que inspira confianza.
            </h1>
            <p className="max-w-xl text-lg text-slate-600">
              Somos un equipo apasionado por el bienestar de los animales. Desde el primer chequeo hasta
              tratamientos especializados, guiamos a las familias con transparencia, empatía y una visión moderna
              de la medicina veterinaria.
            </p>

            {/* CTAs pastel */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="#appointment"
                className="rounded-2xl bg-sky-200 px-8 py-3 text-center text-base font-semibold text-sky-900 shadow-sm ring-1 ring-inset ring-sky-300/60 transition hover:bg-sky-300"
              >
                Agenda tu cita
              </Link>
              <Link
                href="#history"
                className="rounded-2xl bg-white px-8 py-3 text-center text-base font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
              >
                Consulta historial
              </Link>
            </div>

            {/* Métricas claras */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <p className="text-3xl font-semibold text-slate-700">5+</p>
                <p className="text-sm text-slate-500">
                  Especialistas en medicina preventiva, clínica y quirúrgica.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <p className="text-3xl font-semibold text-slate-700">24/7</p>
                <p className="text-sm text-slate-500">Atención de emergencias y monitoreo continuo.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <p className="text-3xl font-semibold text-slate-700">+200</p>
                <p className="text-sm text-slate-500">
                  Familias que confían en nosotros para el cuidado de sus animales.
                </p>
              </div>
            </div>
          </div>

          {/* Panel lateral pastel */}
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-col gap-4 text-sm text-slate-700">
              <div className="rounded-2xl bg-sky-50 p-5 ring-1 ring-inset ring-sky-100">
                <div className="flex items-center gap-3">
                  <Sun className="h-7 w-7 text-amber-500" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-amber-700/80">
                      Ambiente calmado
                    </p>
                    <p className="text-base text-slate-700">
                      Habitaciones con aromas relajantes, música suave y luz natural para minimizar el estrés.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-sky-50 p-5 ring-1 ring-inset ring-sky-100">
                <div className="flex items-center gap-3">
                  <Users className="h-7 w-7 text-sky-600" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-sky-800/80">Comunidad</p>
                    <p className="text-base text-slate-700">
                      Talleres, charlas y experiencias educativas para tutores responsables y felices.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-sky-50 p-5 ring-1 ring-inset ring-sky-100">
                <div className="flex items-center gap-3">
                  <HeartPulse className="h-7 w-7 text-rose-500" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-rose-700/80">Compromiso</p>
                    <p className="text-base text-slate-700">
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
  );
}
