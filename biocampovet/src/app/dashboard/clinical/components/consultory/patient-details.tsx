"use client";

import React from "react";
import Image from "next/image";
import { Loader2, AlertCircle, PawPrint, CalendarDays, Barcode, User2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimalResponse } from "@/app/dashboard/crm/patients/types/animal-response";
import AnimalService from "@/app/dashboard/crm/patients/service/animal-service";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { AnimalSex, AnimalSexLabels } from "@/app/dashboard/crm/patients/enums/animal-sex";
import { AnimalSpecies, AnimalSpeciesLabels, AnimalSpeciesDetails } from "@/app/dashboard/crm/patients/enums/animal-species";

function calcAge(iso?: string) {
  if (!iso) return "—";
  const birth = new Date(iso);
  if (isNaN(birth.getTime())) return "—";
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years > 0) {
    return months > 0 ? `${years} año${years > 1 ? "s" : ""} ${months} mes${months > 1 ? "es" : ""}` : `${years} año${years > 1 ? "s" : ""}`;
  }
  if (months > 0) {
    return `${months} mes${months > 1 ? "es" : ""}`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks > 0) return `${weeks} semana${weeks > 1 ? "s" : ""}`;
  return `${days} día${days !== 1 ? "s" : ""}`;
}

export default function AnimalDetails({ animalId, className }: { animalId: number; className?: string }) {
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
        if (alive)
          toast({
            variant: "destructive",
            title: "Error",
            description: getAaxiosErrorMessage(e),
          });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [animalId]);

  const containerClass =
    (className ? className + " " : "") +
    "w-full md:w-[60%] xl:basis-[18%] xl:max-w-[18%] xl:shrink-0";

  if (loading) {
    return (
      <Card className={containerClass + " overflow-hidden border-muted/50 bg-gradient-to-b from-muted/40 to-background"}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">Cargando ficha…</span>
          </div>
          <div className="mt-4 h-48 w-full animate-pulse rounded-2xl bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!animal) {
    return (
      <Card className={containerClass + " overflow-hidden"}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">No se pudo cargar el animal</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Intenta nuevamente más tarde.</p>
        </CardContent>
      </Card>
    );
  }

  const speciesKey = animal.species as AnimalSpecies;
  const sexKey = animal.sex as AnimalSex;
  const speciesLabel = AnimalSpeciesLabels[speciesKey] ?? animal.species;
  const sexLabel = AnimalSexLabels[sexKey] ?? animal.sex;
  const speciesDetail = AnimalSpeciesDetails[speciesKey];
  const SpeciesIcon = speciesDetail?.icon;

  return (
    <Card className={containerClass + " overflow-hidden border-muted/40 bg-card"}>
      <div className="relative h-28 w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
      <CardContent className="px-4 pb-4 -mt-12">
        <div className="flex items-end gap-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-2 ring-background shadow">
            {animal.photoUrl ? (
              <Image src={animal.photoUrl} alt={`Foto de ${animal.name}`} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <PawPrint className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold leading-tight">{animal.name}</h2>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 flex items-center gap-1.5">
                {SpeciesIcon ? <SpeciesIcon className="h-3.5 w-3.5" /> : null}
                <span>{speciesLabel}</span>
              </Badge>
              {animal.breed ? (
                <Badge className="rounded-full px-2.5 py-0.5" variant="outline">
                  {animal.breed}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-sm font-medium">{animal.owner?.name ?? "—"}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <User2 className="h-3.5 w-3.5" />
              Propietario
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-sm font-medium">{sexLabel ?? "—"}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sexo
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-sm font-medium">{calcAge(animal.birthDate)}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Edad
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-sm font-medium">{animal.microchipNumber || "—"}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Barcode className="h-3.5 w-3.5" />
              Microchip
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border p-3">
            <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Alergias</div>
            <p className="text-sm">
              {animal.allergies && animal.allergies.length > 0 ? animal.allergies.join(", ") : "Ninguna registrada"}
            </p>
          </div>

          <div className="rounded-2xl border p-3">
            <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Condiciones crónicas</div>
            <p className="text-sm">
              {animal.chronicConditions && animal.chronicConditions.length > 0
                ? animal.chronicConditions.join(", ")
                : "Ninguna registrada"}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="secondary"
            className="w-full justify-center"
            onClick={async () => {
              try {
                const history = await AnimalService.getAnimalClinicalHistory(animal.id);
                console.log("Historia clínica", history);
                toast({
                  variant: "default",
                  title: "Historia clínica cargada",
                  description: "Abre el modal o navega a la ruta correspondiente.",
                });
              } catch (e: unknown) {
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: getAaxiosErrorMessage(e),
                });
              }
            }}
          >
            Ver historia clínica
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
