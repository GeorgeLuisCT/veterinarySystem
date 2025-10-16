"use client";

import React from "react";
import Image from "next/image";
import { Loader2, AlertCircle, PawPrint, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimalResponse } from "@/app/dashboard/patients/animals/types/animal-response";
import AnimalService from "@/app/dashboard/patients/animals/service/animal-service";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";


function formatDate(iso?: string) {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "2-digit" }).format(d);
    } catch {
        return iso;
    }
}

export default function AnimalDetails({ animalId }: { animalId: number }) {
    const [animal, setAnimal] = React.useState<AnimalResponse | null>(null);
    const [loading, setLoading] = React.useState(true);

    const { toast } = useToast();

    React.useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const res = await AnimalService.getAnimal(animalId);
                if (alive) setAnimal(res);
            } catch (e) {
                if (alive) toast({
                    variant: "destructive",
                    title: "Error",
                    description: getAaxiosErrorMessage(e),
                });
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [animalId]);

    if (loading) {
        return (
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <CardTitle>Cargando datos del animal…</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
                </CardContent>
            </Card>
        );
    }

    if (!animal) {
        return (
            <Card className="w-full">
                <CardHeader className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No se pudo cargar el animal.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full overflow-hidden">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PawPrint className="h-5 w-5" />
                    <CardTitle className="text-xl font-semibold">{animal.name}</CardTitle>
                </div>
                <Badge variant={animal.isActive ? "default" : "secondary"}>
                    {animal.isActive ? "Activo" : "Inactivo"}
                </Badge>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Foto */}
                    <div className="md:col-span-4">
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted">
                            {animal.photoUrl ? (
                                <Image src={animal.photoUrl} alt={`Foto de ${animal.name}`} fill className="object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <PawPrint className="h-8 w-8" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Datos */}
                    <div className="md:col-span-8">
                        <div className="text-sm text-muted-foreground">ID: {animal.id}</div>

                        <div className="mt-2 grid grid-cols-12 gap-y-2 gap-x-2">
                            <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground">Propietario</div>
                            <div className="col-span-8 md:col-span-9 text-sm">{animal.owner?.name ?? "—"}</div>

                            <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground">Especie</div>
                            <div className="col-span-8 md:col-span-9 text-sm">{animal.species?.name ?? "—"}</div>

                            <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground">Raza</div>
                            <div className="col-span-8 md:col-span-9 text-sm">{animal.breed || "—"}</div>

                            <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground">Sexo</div>
                            <div className="col-span-8 md:col-span-9 text-sm">{animal.sex}</div>

                            <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground">Nacimiento</div>
                            <div className="col-span-8 md:col-span-9 text-sm">{formatDate(animal.birthDate)}</div>

                            <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground">Microchip</div>
                            <div className="col-span-8 md:col-span-9 text-sm">{animal.microchipNumber || "—"}</div>
                        </div>

                        <Separator className="my-3" />

                        <div className="grid grid-cols-12 gap-y-2 gap-x-2">
                            <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground">Alergias</div>
                            <div className="col-span-8 md:col-span-9 text-sm">
                                {animal.allergies && animal.allergies.length > 0 ? animal.allergies.join(", ") : "Ninguna registrada"}
                            </div>

                            <div className="col-span-4 md:col-span-3 text-sm text-muted-foreground">Condiciones crónicas</div>
                            <div className="col-span-8 md:col-span-9 text-sm">
                                {animal.chronicConditions && animal.chronicConditions.length > 0 ? animal.chronicConditions.join(", ") : "Ninguna registrada"}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Button variant="secondary" className="gap-2" onClick={async () => {
                                try {
                                    const history = await AnimalService.getAnimalClinicalHistory(animal.id);
                                    console.log("Historia clínica", history);
                                    toast({
                                        variant: "default",
                                        title: "Historia clínica cargada",
                                        description: "Historia clínica cargada (ver consola). Integra tu modal/ruta aquí.",
                                    });
                                } catch (e: unknown) {
                                    toast({
                                        variant: "destructive",
                                        title: "Error",
                                        description: getAaxiosErrorMessage(e),
                                    });
                                }
                            }}>
                                <ClipboardList className="h-4 w-4" /> Ver historia clínica
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
