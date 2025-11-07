"use client";

import Link from "next/link";

export function LandingFooter() {
    return (
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
    );
}