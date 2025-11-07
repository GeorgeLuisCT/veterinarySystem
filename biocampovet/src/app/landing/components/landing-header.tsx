"use client";

import Link from "next/link";
import { Dog, HeartPulse, Sun, Users } from "lucide-react";

export function LandingHeader() {
    return (
        <header className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%)]" />
            <div className="relative z-10 mx-auto flex max-w-8xl flex-col gap-16 px-6 pb-24 pt-16 md:px-10 lg:px-16">
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
    );
}