"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageSquare, Microscope, Camera, CheckCircle, ArrowLeft } from "lucide-react";

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

// --- UI mínimos ---
const Button = ({
  children,
  onClick,
  variant = "default",
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline";
  className?: string;
  disabled?: boolean;
}) => {
  const styles =
    variant === "outline"
      ? "border bg-white text-slate-900 hover:bg-slate-50"
      : "bg-pink-600 hover:bg-pink-700 text-white";
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-1.5 transition-colors disabled:opacity-50 ${styles} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border bg-white text-slate-900 shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
      props.className || ""
    }`}
  />
);

// --- Datos DEMO y helpers (reemplaza por llamadas a tu API) ---
const groomers: Groomer[] = [
  { id: 101, name: "Ana" },
  { id: 102, name: "Carlos" },
];
const statusConfig: Record<GroomingStatus, { text: string; color: string }> = {
  Esperando: { text: "Esperando", color: "bg-gray-100 text-gray-800" },
  "En Baño": { text: "En Baño", color: "bg-cyan-100 text-cyan-800" },
  "En Secado": { text: "En Secado", color: "bg-sky-100 text-sky-800" },
  "En Corte": { text: "En Corte", color: "bg-indigo-100 text-indigo-800" },
  Finalizado: { text: "Listo para Recoger", color: "bg-pink-100 text-pink-800" },
};

// Simulación: obtén los datos por ID (haz tu fetch real aquí)
function getPatientById(id: number): GroomingPatient | null {
  const demo: GroomingPatient[] = [
    { id: 1, name: "Kiara", ownerName: "Sofía Gomez", service: "Baño y Corte", status: "En Baño", groomerId: 101 },
    { id: 6, name: "Princesa", ownerName: "Laura Vera", service: "Baño Básico", status: "Esperando", groomerId: 102 },
    { id: 7, name: "Paco", ownerName: "David Rios", service: "Corte de Raza", status: "Esperando", groomerId: 101 },
  ];
  return demo.find((p) => p.id === id) ?? null;
}

export default function GroomingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const initial = useMemo(() => getPatientById(id), [id]);
  const [patient, setPatient] = useState<GroomingPatient | null>(initial);

  const updateStatus = (newStatus: GroomingStatus) => {
    if (!patient) return;
    setPatient({ ...patient, status: newStatus });
    // TODO: llamar a tu API para persistir el estado
  };

  const handleFinalize = () => {
    if (!patient) return;
    updateStatus("Finalizado");
    alert(
      `SERVICIO FINALIZADO PARA ${patient.name}\n\n- Se enviará una notificación a ${patient.ownerName}.\n- Los cargos por "${patient.service}" se han enviado al Punto de Venta.`
    );
  };

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/grooming")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la cola
        </Button>
        <p>No se encontró el paciente.</p>
      </div>
    );
  }

  const status = statusConfig[patient.status];
  const groomer = groomers.find((g) => g.id === patient.groomerId);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <Button variant="outline" onClick={() => router.push("/dashboard/grooming")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la cola
      </Button>

      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{patient.name}</CardTitle>
              <p className="text-sm text-gray-500">
                {patient.service} con <span className="font-medium">{groomer?.name}</span> para {patient.ownerName}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status.color}`}>{status.text}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Actualizar Estado</h4>
            <div className="flex flex-wrap gap-2">
              {Object.keys(statusConfig).map((s) => (
                <Button
                  key={s}
                  variant={patient.status === s ? "default" : "outline"}
                  onClick={() => updateStatus(s as GroomingStatus)}
                >
                  {statusConfig[s as GroomingStatus].text}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center mb-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Notas de Comportamiento
              </label>
              <Textarea rows={3} placeholder="Ej: Se portó excelente, un poco ansioso con el secador..." />
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <label className="text-sm font-medium text-red-800 flex items-center mb-1">
                <Microscope className="h-4 w-4 mr-2" />
                Observaciones Clínicas Relevantes
              </label>
              <Textarea
                rows={3}
                placeholder="¡IMPORTANTE! Anotar aquí cualquier hallazgo en la piel, bultos, parásitos, etc."
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center mb-1">
                <Camera className="h-4 w-4 mr-2" />
                Fotos (Antes y Después)
              </label>
              <div className="p-4 border-2 border-dashed rounded-lg flex justify-center items-center">
                <Button variant="outline">Subir Fotos</Button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button onClick={handleFinalize} disabled={patient.status === "Finalizado"}>
              <CheckCircle className="mr-2 h-4 w-4" /> Finalizar y Notificar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
