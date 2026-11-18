import {
  Dog, Cat, Rabbit, Mouse, Squirrel, Bird, Turtle, Tractor, Beef, Cloud, Mountain, PiggyBank, Package, HelpCircle, PawPrint,
} from "lucide-react";
import { CatalogKey, catalogDetails, catalogEnum, catalogLabels, catalogOptions } from "@/lib/catalogs";

/** Especies: catálogo editable (Configuración → Catálogos). Estos son los valores con los que nace cada empresa. */
export const AnimalSpecies = catalogEnum(CatalogKey.AnimalSpecies, {
  CANINE: { label: "Perro" },
  FELINE: { label: "Gato" },
  RABBIT: { label: "Conejo" },
  HAMSTER: { label: "Hámster" },
  GUINEA_PIG: { label: "Cobayo / Cuyo" },
  AVIAN: { label: "Ave" },
  REPTILE: { label: "Reptil" },
  EQUINE: { label: "Equino" },
  BOVINE: { label: "Bovino" },
  OVINE: { label: "Ovino" },
  CAPRINE: { label: "Caprino" },
  PORCINE: { label: "Porcino" },
  CAMELID: { label: "Camélido" },
  OTHER: { label: "Otro" },
});
export type AnimalSpecies = string;

export const AnimalSpeciesLabels = catalogLabels(CatalogKey.AnimalSpecies);

export interface SpeciesDetails {
  label: string;
  icon: React.ElementType;
  colorClass: string;
}

/** Ícono y color de las especies conocidas; una especie agregada por la empresa usa el genérico. */
export const AnimalSpeciesDetails = catalogDetails<SpeciesDetails>(
  CatalogKey.AnimalSpecies,
  {
    CANINE: { label: "Perro", icon: Dog, colorClass: "bg-blue-500" },
    FELINE: { label: "Gato", icon: Cat, colorClass: "bg-orange-500" },
    RABBIT: { label: "Conejo", icon: Rabbit, colorClass: "bg-pink-400" },
    HAMSTER: { label: "Hámster", icon: Mouse, colorClass: "bg-yellow-500" },
    GUINEA_PIG: { label: "Cobayo / Cuyo", icon: Squirrel, colorClass: "bg-amber-600" },
    AVIAN: { label: "Ave", icon: Bird, colorClass: "bg-sky-400" },
    REPTILE: { label: "Reptil", icon: Turtle, colorClass: "bg-green-600" },
    EQUINE: { label: "Equino", icon: Tractor, colorClass: "bg-stone-500" },
    BOVINE: { label: "Bovino", icon: Beef, colorClass: "bg-gray-700" },
    OVINE: { label: "Ovino", icon: Cloud, colorClass: "bg-slate-400" },
    CAPRINE: { label: "Caprino", icon: Mountain, colorClass: "bg-lime-700" },
    PORCINE: { label: "Porcino", icon: PiggyBank, colorClass: "bg-rose-400" },
    CAMELID: { label: "Camélido", icon: Package, colorClass: "bg-yellow-700" },
    OTHER: { label: "Otro", icon: HelpCircle, colorClass: "bg-black" },
  },
  { icon: PawPrint, colorClass: "bg-slate-500" }
);

export const AnimalSpeciesOptions = catalogOptions(CatalogKey.AnimalSpecies);
