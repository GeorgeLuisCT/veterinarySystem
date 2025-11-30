"use client";

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="relative border-t border-slate-200 bg-white/90 py-10">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
        <p>© {new Date().getFullYear()} BiocampoVet. Crecemos junto a quienes cuidan la vida.</p>
        <div className="flex items-center gap-6">
          <Link href="#services" className="transition hover:text-slate-900">
            Servicios
          </Link>
          <Link href="#history" className="transition hover:text-slate-900">
            Historial
          </Link>
          <Link href="#appointment" className="transition hover:text-slate-900">
            Citas
          </Link>
        </div>
      </div>
    </footer>
  );
}
