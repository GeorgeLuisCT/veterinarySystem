"use client";

import { useEffect, useState } from "react";
import { AnimalService } from "@/app/dashboard/patients/animals/service/animal-service";
import { ClinicalHistoryResponse } from "@/app/dashboard/patients/animals/types/clinical-history-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  Stethoscope,
  Pill,
  Scissors,
  Calendar,
  User,
  PawPrint,
  Clock,
} from "lucide-react";

interface Props {
  animalId: number;
}

const ClinicalHistoryTimeline = ({ animalId }: Props) => {
  const [data, setData] = useState<ClinicalHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await AnimalService.getAnimalClinicalHistory(animalId);
        setData(res);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [animalId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completado":
        return "bg-green-100 text-green-800 border-green-200";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "consulta":
        return "bg-blue-500";
      case "servicio":
        return "bg-purple-500";
      case "procedimiento":
        return "bg-orange-500";
      case "medicamento":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) return <p className="text-center">Cargando historial clínico...</p>;
  if (!data) return <p className="text-center">No se encontró historial clínico.</p>;

  const timelineEvents = [
    ...data.consultationsGrouped.consultations.map((c) => ({
      id: `consulta-${c.id}`,
      date: c.consultationDate,
      type: "consulta",
      title: "Consulta Clínica",
      description: `${c.diagnosis || "Sin diagnóstico"}`,
      icon: Stethoscope,
      status: "completado",
      cost: "-",
    })),
    ...Object.values(data.saleVetServicesGrouped.categories).flat().map((s) => ({
      id: `servicio-${s.id}`,
      date: new Date().toISOString(),
      type: "servicio",
      title: s.vetServiceName,
      description: "Servicio realizado",
      icon: Heart,
      status: "completado",
      cost: `${s.price} soles`,
    })),
    ...Object.values(data.saleVetProceduresGrouped.categories).flat().map((p) => ({
      id: `procedimiento-${p.id}`,
      date: new Date().toISOString(),
      type: "procedimiento",
      title: p.vetProcedureName,
      description: p.status,
      icon: Scissors,
      status: p.status,
      cost: `${p.price} soles`,
    })),
    ...Object.values(data.saleProductsGrouped.categories).flat().map((p) => ({
      id: `producto-${p.id}`,
      date: new Date().toISOString(),
      type: "medicamento",
      title: p.productName,
      description: `Administración - ${p.quantityEquivalent} unidades`,
      icon: Pill,
      status: "completado",
      cost: `${p.price} soles`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const { name, breed, birthDate, species, owner } = data.animal;

  const resumen = {
    consultas: data.consultationsGrouped.consultations.length,
    servicios: Object.values(data.saleVetServicesGrouped.categories).flat().length,
    procedimientos: Object.values(data.saleVetProceduresGrouped.categories).flat().length,
    medicamentos: Object.values(data.saleProductsGrouped.categories).flat().length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                <AvatarImage src="/placeholder.svg" alt={name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                  {name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <PawPrint className="h-6 w-6 text-blue-600" />
                  {name} - Historial Veterinario
                </CardTitle>
                <p className="text-gray-600 mt-1">{breed} • {species.name}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Nacimiento:</span>
                <span className="font-medium">{new Date(birthDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Dueño:</span>
                <span className="font-medium">{owner.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Edad:</span>
                <span className="font-medium">{new Date().getFullYear() - new Date(birthDate).getFullYear()} años</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-purple-600"></div>

          <div className="space-y-8">
            {timelineEvents.map((event) => {
              const Icon = event.icon;
              return (
                <div key={event.id} className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${getTypeColor(event.type)} shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <Card className="flex-1 shadow-md border-0 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6 overflow-x-auto">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">{event.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`mb-2 ${getStatusColor(event.status)}`}>{event.status}</Badge>
                          <p className="text-lg font-bold text-gray-800">{event.cost}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Resumen del Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Stethoscope className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{resumen.consultas}</p>
                <p className="text-sm text-gray-600">Consultas</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Heart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{resumen.servicios}</p>
                <p className="text-sm text-gray-600">Servicios</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Scissors className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">{resumen.procedimientos}</p>
                <p className="text-sm text-gray-600">Procedimientos</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Pill className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{resumen.medicamentos}</p>
                <p className="text-sm text-gray-600">Medicamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClinicalHistoryTimeline;
