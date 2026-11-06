"use client";

import { useEffect, useState } from "react";
import { PawPrint, User, Calendar, Tag, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import AnimalService from "../service/animal-service";
import { AnimalResponse } from "../types/animal-response";
import { AnimalSpeciesLabels } from "../enums/animal-species";

interface AnimalDetailProps {
  animalId: number;
  onClose?: () => void;
}

export function AnimalDetail({ animalId, onClose }: AnimalDetailProps) {
  const [animal, setAnimal] = useState<AnimalResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnimal() {
      setLoading(true);
      const data = await AnimalService.getAnimal(animalId);
      setAnimal(data);
      setLoading(false);
    }
    fetchAnimal();
  }, [animalId]);

  if (loading || !animal) {
    return (
      <div className="p-4 text-sm space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg p-4 space-y-5 text-sm">
      {onClose && (
        <div className="flex justify-end">
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <DetailRow
          icon={<PawPrint className="w-5 h-5" />}
          label="Nombre del Animal:"
          value={animal.name}
        />
        <DetailRow
          icon={<Layers className="w-5 h-5" />}
          label="Especie:"
          value={AnimalSpeciesLabels[animal.species] || "-"}
        />
        <DetailRow
          icon={<Tag className="w-5 h-5" />}
          label="Raza:"
          value={animal.breed || "-"}
        />
        <DetailRow
          icon={<Calendar className="w-5 h-5" />}
          label="Fecha de Nacimiento:"
          value={animal.birthDate || "-"}
        />
        <DetailRow
          icon={<User className="w-5 h-5" />}
          label="Dueño:"
          value={animal.owner?.name || "-"}
        />
      </div>

      {onClose && (
        <>
          <Separator />
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-medium min-w-[120px]">{label}</span>
      <span className="text-muted-foreground truncate">{value}</span>
    </div>
  );
}
