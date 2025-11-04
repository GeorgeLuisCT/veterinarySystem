"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
    FileText, Syringe, Pill, Activity, Download, Stethoscope, Bug, HeartPulse, Thermometer,
    Weight, AlertTriangle, LineChart, Camera, Info, Utensils, ShieldCheck,
    MonitorCog,
    Scissors
} from "lucide-react"

const medicalRecords = [
    {
        id: 1,
        patientName: "Max",
        owner: "Carlos Rodríguez",
        lastVisit: "2024-01-05",
        species: "Perro",
        breed: "Golden Retriever",
        age: "5 años",
        sex: "Macho (Castrado)",
        microchip: "985100012345678",
        allergies: ["Pollo"],
        chronicConditions: ["Artritis leve en cadera derecha"],
        behaviorNotes: "Ansioso con ruidos fuertes, amigable con el personal.",
        diet: {
            food: "Royal Canin Hypoallergenic",
            quantity: "350g al día",
            notes: "Dieta estricta por alergia al pollo. Evitar snacks no recetados.",
        },
        weightHistory: [
            { date: "2023-06-15", weightKg: 29.8 },
            { date: "2023-12-10", weightKg: 30.2 },
            { date: "2024-01-05", weightKg: 30.5 },
        ],
        consultations: [
            {
                date: "2024-01-05",
                type: "Consulta General",
                vet: "Dra. María González",
                reasonForVisit: "El propietario reporta que Max se rasca mucho la oreja derecha.",
                vitals: { weight: "30.5 kg", temp: "38.5°C", hr: "90 lpm", rr: "20 rpm" },
                diagnosis: "Otitis externa leve",
                treatment: "Limpieza de oídos y gotas antibióticas",
                notes: "Mejoría notable. Control en 7 días.",
            },
            {
                date: "2023-12-10",
                type: "Chequeo y Vacunación",
                vet: "Dr. Pedro Martínez",
                reasonForVisit: "Control anual y aplicación de vacuna antirrábica.",
                vitals: { weight: "30.2 kg", temp: "38.6°C", hr: "85 lpm", rr: "18 rpm" },
                diagnosis: "Paciente sano, chequeo preventivo",
                treatment: "Vacuna antirrábica anual",
                notes: "Sin reacciones adversas.",
            },
        ],
        vaccines: [
            { name: "Antirrábica", date: "2023-12-10", nextDue: "2024-12-10", status: "Vigente" },
            { name: "Parvovirus", date: "2023-06-15", nextDue: "2024-06-15", status: "Próxima" },
            { name: "Moquillo", date: "2023-06-15", nextDue: "2024-06-15", status: "Próxima" },
        ],
        deworming: [
            { date: "2023-12-10", product: "Milbemax", type: "Interna", nextDue: "2024-03-10" },
            { date: "2023-12-28", product: "Bravecto", type: "Externa", nextDue: "2024-03-28" },
        ],
        procedures: [
            { date: "2021-03-15", procedure: "Castración", vet: "Dr. Alan Morales", notes: "Recuperación sin complicaciones." },
        ],
        prescriptions: [
            { date: "2024-01-05", medication: "Otomax (Gotas óticas)", dosage: "3 gotas cada 12 horas", duration: "7 días" },
        ],
        labResults: [
            { date: "2023-11-20", test: "Hemograma completo", result: "Normal", file: "hemograma_max_112023.pdf" },
        ],
        imagingStudies: [
            { date: "2023-05-10", type: "Radiografía de Cadera", summary: "Leves signos de displasia en cadera derecha, compatibles con artritis.", file: "rx_cadera_max_052023.dcm" }
        ],
        groomingHistory: [
            { date: "2022-09-01", procedure: "Profilaxis Dental", vet: "Dr. Alan Morales", notes: "Eliminación de sarro moderado. Sin extracciones." }
        ],
    },
];

const EmptyState = ({ icon: Icon, message }) => (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">{message}</p>
    </div>
);

const ConsultationsTab = ({ consultations }) => (
    <div className="space-y-4">
        {consultations.length > 0 ? (
            consultations.map((consultation, index) => (
                <Card key={index} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-start justify-between bg-muted/50 p-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-foreground">{consultation.date}</p>
                                <Badge variant="outline">{consultation.type}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{consultation.vet}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                        <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
                            <Info className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <div>
                                <p className="font-medium text-foreground">Motivo de la consulta:</p>
                                <p className="text-muted-foreground">{consultation.reasonForVisit}</p>
                            </div>
                        </div>

                        {consultation.vitals && (
                            <div className="grid grid-cols-2 gap-3 rounded-md border p-3 text-sm sm:grid-cols-4">
                                <div className="flex items-center gap-2"><Weight className="h-4 w-4 text-primary" /> <span>{consultation.vitals.weight}</span></div>
                                <div className="flex items-center gap-2"><Thermometer className="h-4 w-4 text-primary" /> <span>{consultation.vitals.temp}</span></div>
                                <div className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" /> <span>{consultation.vitals.hr}</span></div>
                                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> <span>{consultation.vitals.rr}</span></div>
                            </div>
                        )}

                        <div className="space-y-2 text-sm">
                            <div>
                                <p className="font-medium text-foreground">Diagnóstico:</p>
                                <p className="text-muted-foreground">{consultation.diagnosis}</p>
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Tratamiento:</p>
                                <p className="text-muted-foreground">{consultation.treatment}</p>
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Notas:</p>
                                <p className="text-muted-foreground">{consultation.notes}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
        ) : <EmptyState icon={FileText} message="No hay registros de consultas." />}
    </div>
);

const VaccinesTab = ({ vaccines }) => (
    <div className="space-y-3">
        {vaccines.length > 0 ? (
            vaccines.map((vaccine, index) => (
                <Card key={index} className="flex items-center justify-between p-4">
                    <div>
                        <p className="font-semibold text-foreground">{vaccine.name}</p>
                        <p className="text-sm text-muted-foreground">Aplicada: {vaccine.date} • Próxima: {vaccine.nextDue}</p>
                    </div>
                    <Badge variant={vaccine.status === "Vigente" ? "default" : "secondary"} className={vaccine.status === "Vigente" ? "bg-green-600 text-white" : ""}>
                        {vaccine.status}
                    </Badge>
                </Card>
            ))
        ) : <EmptyState icon={Syringe} message="No hay registros de vacunas." />}
    </div>
);

const DewormingTab = ({ deworming }) => (
    <div className="space-y-3">
        {deworming.length > 0 ? (
            deworming.map((item, index) => (
                <Card key={index} className="flex items-center justify-between p-4">
                    <div>
                        <p className="font-semibold text-foreground">{item.product} <Badge variant="outline">{item.type}</Badge></p>
                        <p className="text-sm text-muted-foreground">Aplicada: {item.date} • Próxima: {item.nextDue}</p>
                    </div>
                </Card>
            ))
        ) : <EmptyState icon={Bug} message="No hay registros de desparasitación." />}
    </div>
);

const ProceduresTab = ({ procedures }) => (
    <div className="space-y-4">
        {procedures.length > 0 ? (
            procedures.map((item, index) => (
                <Card key={index} className="p-4">
                    <div className="mb-2">
                        <p className="font-semibold text-foreground">{item.procedure}</p>
                        <p className="text-sm text-muted-foreground">Fecha: {item.date} • Veterinario: {item.vet}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-foreground">Notas:</p>
                        <p className="text-muted-foreground">{item.notes}</p>
                    </div>
                </Card>
            ))
        ) : <EmptyState icon={Stethoscope} message="No hay registros de procedimientos." />}
    </div>
);

const PrescriptionsTab = ({ prescriptions }) => (
    <div className="space-y-4">
        {prescriptions.length > 0 ? (
            prescriptions.map((item, index) => (
                <Card key={index} className="p-4">
                    <div className="mb-2">
                        <p className="font-semibold text-foreground">{item.medication}</p>
                        <p className="text-sm text-muted-foreground">Fecha: {item.date}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p><span className="font-medium text-foreground">Dosis:</span> {item.dosage}</p>
                        <p><span className="font-medium text-foreground">Duración:</span> {item.duration}</p>
                    </div>
                </Card>
            ))
        ) : <EmptyState icon={Pill} message="No hay recetas registradas." />}
    </div>
);

const LabsTab = ({ labResults }) => (
    <div className="space-y-3">
        {labResults.length > 0 ? (
            labResults.map((lab, index) => (
                <Card key={index} className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="font-semibold text-foreground">{lab.test}</p>
                        <p className="text-sm text-muted-foreground">Fecha: {lab.date} • Resultado: <span className="font-medium text-foreground">{lab.result}</span></p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" /> {lab.file}
                    </Button>
                </Card>
            ))
        ) : <EmptyState icon={Activity} message="No hay resultados de laboratorio." />}
    </div>
);

const NutritionTab = ({ diet }) => (
    <div>
        {diet ? (
            <Card className="p-4">
                <CardHeader className="p-2">
                    <CardTitle className="flex items-center gap-2 text-lg"><Utensils className="h-5 w-5" /> Dieta Actual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2 text-sm">
                    <div>
                        <p className="font-medium text-foreground">Alimento Principal:</p>
                        <p className="text-muted-foreground">{diet.food}</p>
                    </div>
                    <div>
                        <p className="font-medium text-foreground">Cantidad Diaria:</p>
                        <p className="text-muted-foreground">{diet.quantity}</p>
                    </div>
                    <div>
                        <p className="font-medium text-foreground">Notas Importantes:</p>
                        <p className="text-muted-foreground">{diet.notes}</p>
                    </div>

                    <button className="rounded-full bg-red-500 px-4 py-2 text-white">este bton es recordatorio que se debe implementar tambien historial de dietas</button>
                </CardContent>
            </Card>
        ) : <EmptyState icon={Utensils} message="No hay información nutricional registrada." />}
    </div>
);

const WeightHistoryTab = ({ weightHistory }) => (
    <div>
        {weightHistory && weightHistory.length > 0 ? (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><LineChart className="h-5 w-5" /> Evolución del Peso</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y">
                        {weightHistory.slice().reverse().map((entry, index) => (
                            <li key={index} className="flex items-center justify-between py-3">
                                <p className="text-sm text-muted-foreground">{entry.date}</p>
                                <p className="font-semibold text-foreground">{entry.weightKg} kg</p>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        ) : <EmptyState icon={LineChart} message="No hay historial de peso registrado." />}
    </div>
);

const ImagingTab = ({ imagingStudies }) => (
    <div className="space-y-3">
        {imagingStudies.length > 0 ? (
            imagingStudies.map((study, index) => (
                <Card key={index} className="p-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <p className="font-semibold text-foreground">{study.type}</p>
                            <p className="text-sm text-muted-foreground">Fecha: {study.date}</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <Download className="mr-2 h-4 w-4" /> {study.file}
                        </Button>
                    </div>
                    <div className="mt-3 border-t pt-3 text-sm">
                        <p className="font-medium text-foreground">Resumen del Informe:</p>
                        <p className="text-muted-foreground">{study.summary}</p>
                    </div>
                </Card>
            ))
        ) : <EmptyState icon={Camera} message="No hay estudios de imagen." />}
    </div>
);

const GroomingTab = ({ groomingHistory }) => (
    <div className="space-y-4">
        {groomingHistory && groomingHistory.length > 0 ? (
            groomingHistory.map((item, index) => (
                <Card key={index} className="p-4">
                    <div className="mb-2">
                        <p className="font-semibold text-foreground">{item.service}</p>
                        <p className="text-sm text-muted-foreground">Fecha: {item.date} • Estilista: {item.groomer}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-foreground">Notas:</p>
                        <p className="text-muted-foreground">{item.notes}</p>
                    </div>
                    {item.clinicalObservation && (
                        <div className="mt-2 flex items-center gap-2 text-sm p-2 bg-red-50 text-red-700 rounded-md border border-red-200">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            <span>Se registró una observación clínica en esta sesión.</span>
                        </div>
                    )}
                </Card>
            ))
        ) : <EmptyState icon={Scissors} message="No hay historial de peluquería registrado." />}
    </div>
);

export default function MedicalHistoryPage() {
    const [selectedPatient] = useState(medicalRecords[0]);

    if (!selectedPatient) return <div>Cargando paciente...</div>;

    const lastConsultation = selectedPatient.consultations[0];

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <main className="flex-1 p-4 sm:p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                                <div>
                                    <CardTitle className="text-2xl">{selectedPatient.patientName}</CardTitle>
                                    <CardDescription>
                                        Propietario: {selectedPatient.owner} • Última visita: {selectedPatient.lastVisit}
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Exportar PDF
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 rounded-lg border bg-background p-4">
                                <h3 className="font-semibold text-foreground">Ficha Clínica del Paciente</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-4">
                                    <div><span className="text-muted-foreground">Especie: </span><span className="font-medium">{selectedPatient.species}</span></div>
                                    <div><span className="text-muted-foreground">Raza: </span><span className="font-medium">{selectedPatient.breed}</span></div>
                                    <div><span className="text-muted-foreground">Sexo: </span><span className="font-medium">{selectedPatient.sex}</span></div>
                                    <div><span className="text-muted-foreground">Edad: </span><span className="font-medium">{selectedPatient.age}</span></div>
                                    <div className="col-span-2"><span className="text-muted-foreground">Microchip: </span><span className="font-medium">{selectedPatient.microchip}</span></div>
                                </div>

                                {((selectedPatient.allergies.length > 0 && selectedPatient.allergies[0] !== "Ninguna conocida") || selectedPatient.chronicConditions.length > 0) && (
                                    <div className="space-y-3 rounded-md border border-destructive/50 bg-destructive/5 p-3">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-destructive" />
                                            <h4 className="font-semibold text-destructive">Alertas Médicas Importantes</h4>
                                        </div>
                                        {selectedPatient.allergies.length > 0 && selectedPatient.allergies[0] !== "Ninguna conocida" && (
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <span className="font-medium text-foreground">Alergias:</span>
                                                {selectedPatient.allergies.map((allergy) => (<Badge key={allergy} variant="destructive">{allergy}</Badge>))}
                                            </div>
                                        )}
                                        {selectedPatient.chronicConditions.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <span className="font-medium text-foreground">Condiciones Crónicas:</span>
                                                {selectedPatient.chronicConditions.map((condition) => (<Badge key={condition} variant="secondary" className="border border-amber-500/50">{condition}</Badge>))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {lastConsultation && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Resumen de la Última Visita ({lastConsultation.date})</CardTitle>
                                <CardDescription>Atendido por: {lastConsultation.vet}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                    <Info className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Motivo de la consulta:</p>
                                        <p className="text-muted-foreground">{lastConsultation.reasonForVisit}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium">Diagnóstico:</p>
                                    <p className="text-muted-foreground">{lastConsultation.diagnosis}</p>
                                </div>
                                <div>
                                    <p className="font-medium">Tratamiento Aplicado:</p>
                                    <p className="text-muted-foreground">{lastConsultation.treatment}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Historial Clínico y Tratamientos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="consultations">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="consultations"><FileText className="mr-2 h-4 w-4" />Consultas</TabsTrigger>
                                        <TabsTrigger value="procedures"><Stethoscope className="mr-2 h-4 w-4" />Procedimientos</TabsTrigger>
                                        <TabsTrigger value="prescriptions"><Pill className="mr-2 h-4 w-4" />Recetas</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="consultations" className="mt-4"><ConsultationsTab consultations={selectedPatient.consultations} /></TabsContent>
                                    <TabsContent value="procedures" className="mt-4"><ProceduresTab procedures={selectedPatient.procedures} /></TabsContent>
                                    <TabsContent value="prescriptions" className="mt-4"><PrescriptionsTab prescriptions={selectedPatient.prescriptions} /></TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>

                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Medicina Preventiva</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="vaccinesAndDeworming">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="vaccinesAndDeworming"><ShieldCheck className="mr-2 h-4 w-4" />Vacunas y Desp.</TabsTrigger>
                                        <TabsTrigger value="dental"><MonitorCog className="mr-2 h-4 w-4" />Baño y Peluquería</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="vaccinesAndDeworming" className="mt-4 space-y-4">
                                        <h4 className="font-semibold">Vacunas</h4>
                                        <VaccinesTab vaccines={selectedPatient.vaccines} />
                                        <h4 className="mt-4 font-semibold">Desparasitación</h4>
                                        <DewormingTab deworming={selectedPatient.deworming} />
                                    </TabsContent>
                                    <TabsContent value="dental" className="mt-4">
                                        <GroomingTab groomingHistory={selectedPatient.groomingHistory} />
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="col-span-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Diagnóstico y Seguimiento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="labsAndImaging">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="labsAndImaging"><Activity className="mr-2 h-4 w-4" />Laboratorio e Imágenes</TabsTrigger>
                                    <TabsTrigger value="weight"><LineChart className="mr-2 h-4 w-4" />Evolución de Peso</TabsTrigger>
                                    <TabsTrigger value="nutrition"><Utensils className="mr-2 h-4 w-4" />Nutrición</TabsTrigger>
                                </TabsList>
                                <TabsContent value="labsAndImaging" className="mt-4 space-y-4">
                                    <h4 className="font-semibold">Resultados de Laboratorio</h4>
                                    <LabsTab labResults={selectedPatient.labResults} />
                                    <h4 className="mt-4 font-semibold">Estudios de Imagen</h4>
                                    <ImagingTab imagingStudies={selectedPatient.imagingStudies} />
                                </TabsContent>
                                <TabsContent value="weight" className="mt-4"><WeightHistoryTab weightHistory={selectedPatient.weightHistory} /></TabsContent>
                                <TabsContent value="nutrition" className="mt-4"><NutritionTab diet={selectedPatient.diet} /></TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    )
}