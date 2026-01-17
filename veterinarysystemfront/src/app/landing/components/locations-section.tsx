"use client";

import { MapPin, Phone, HeartPulse } from "lucide-react";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";

interface Props {
  branches: BranchResponse[];
}

export function LocationsSection({ branches }: Props) {
  return (
    <section className="grid gap-10 rounded-[2.5rem] border border-slate-200 bg-white/90 p-10 shadow-sm lg:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col gap-4">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-700/80">Ubicaciones</p>
        <h2 className="text-3xl font-semibold text-slate-700 sm:text-4xl">
          Tres sedes conectadas con el campo y la ciudad.
        </h2>
        <p className="text-lg text-slate-600">
          Cada sede está diseñada para crear experiencias tranquilas: salas separadas por especie, jardines sensoriales y
          espacios de espera al aire libre para disminuir la ansiedad de los animales.
        </p>

        <div className="mt-6 grid gap-4 text-sm">
          {branches.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-700 shadow-sm">
              Estamos actualizando la información de nuestras sedes. Contáctanos y te guiaremos personalmente.
            </p>
          ) : (
            branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-700 shadow-sm"
              >
                <MapPin className="mt-1 h-6 w-6 flex-none text-sky-600" />
                <div>
                  <h3 className="text-base font-semibold text-slate-700">{branch.name}</h3>
                  <p className="text-sm text-slate-600">{branch.location}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 text-slate-700 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-700">¿Necesitas hablar con alguien?</h3>
        <p className="mt-3 text-sm text-slate-600">
          Nuestro equipo de bienestar animal te orienta sobre programas preventivos, planes corporativos y atención a tu medida.
        </p>

        <div className="mt-6 space-y-4">
          <a
            href="tel:+51951194623"
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-inset ring-sky-300 transition hover:bg-sky-50"
          >
            <Phone className="h-5 w-5 text-sky-600" />
            +51 951 194 623
          </a>
          <a
            href="mailto:contacto@coryvet.com"
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-inset ring-sky-300 transition hover:bg-sky-50"
          >
            <HeartPulse className="h-5 w-5 text-rose-500" />
            contacto@coryvet.com
          </a>
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-500">
          Emergencias 24/7 · Traslado asistido disponible
        </p>
      </div>
    </section>
  );
}
