"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors, User } from "lucide-react";

// --- Tipos ---
type GroomingStatus = "Esperando" | "En Baño" | "En Secado" | "En Corte" | "Finalizado";
type GroomingPatient = {
  id: number;
  name: string;
  ownerName: string;
  service: string;
  status: GroomingStatus;
  groomerId: number;
  notes?: string;
  clinicalObservations?: string;
};
type Groomer = { id: number; name: string };

// --- UI minimal (tú puedes cambiarlos por shadcn/ui si quieres) ---
const Button = ({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <button
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 transition-colors ${className}`}
    onClick={onClick}
  >
    {children}
  </button>
);

// --- DATOS DEMO (migrar a tu servicio real) ---
const groomers: Groomer[] = [
  { id: 101, name: "Ana" },
  { id: 102, name: "Carlos" },
];
const initialGroomingQueue: GroomingPatient[] = [
  { id: 4, name: "Kiara", ownerName: "Sofía Gomez", service: "Baño y Corte", status: "En Baño", groomerId: 101 },
  { id: 6, name: "Princesa", ownerName: "Laura Vera", service: "Baño Básico", status: "Esperando", groomerId: 102 },
  { id: 7, name: "Paco", ownerName: "David Rios", service: "Corte de Raza", status: "Esperando", groomerId: 101 },
];

const statusConfig: Record<GroomingStatus, { text: string; color: string }> = {
  Esperando: { text: "Esperando", color: "bg-gray-100 text-gray-800" },
  "En Baño": { text: "En Baño", color: "bg-cyan-100 text-cyan-800" },
  "En Secado": { text: "En Secado", color: "bg-sky-100 text-sky-800" },
  "En Corte": { text: "En Corte", color: "bg-indigo-100 text-indigo-800" },
  Finalizado: { text: "Listo para Recoger", color: "bg-pink-100 text-pink-800" },
};

export default function GroomingBoardPage() {
  const router = useRouter();
  const [queue] = useState<GroomingPatient[]>(initialGroomingQueue);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold flex items-center">
        <Scissors className="mr-2" /> Peluquería • Cola de Trabajo
      </h1>

      <div className="grid gap-3">
        {queue.map((patient) => {
          const status = statusConfig[patient.status];
          const groomer = groomers.find((g) => g.id === patient.groomerId);
          return (
            <div
              key={patient.id}
              className="p-4 bg-white rounded-lg border shadow-sm flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-lg">{patient.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{patient.service}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {groomer?.name}
                </p>
              </div>

              {/* Botón para ir al DETALLE */}
              <Button onClick={() => router.push(`/dashboard/grooming/${patient.id}`)}>
                Atender
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
