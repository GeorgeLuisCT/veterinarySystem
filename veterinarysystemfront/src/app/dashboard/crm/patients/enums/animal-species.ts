import { 
  Dog, 
  Cat, 
  Rabbit, 
  Mouse, 
  Squirrel, 
  Bird, 
  Turtle, 
  Tractor, 
  Beef, 
  Cloud,   
  Mountain, 
  PiggyBank, 
  Package, 
  HelpCircle 
} from 'lucide-react';

export enum AnimalSpecies {
  CANINE = "CANINE",
  FELINE = "FELINE",
  RABBIT = "RABBIT",
  HAMSTER = "HAMSTER",
  GUINEA_PIG = "GUINEA_PIG",
  AVIAN = "AVIAN",
  REPTILE = "REPTILE",
  EQUINE = "EQUINE",
  BOVINE = "BOVINE",
  OVINE = "OVINE",
  CAPRINE = "CAPRINE",
  PORCINE = "PORCINE",
  CAMELID = "CAMELID",
  OTHER = "OTHER",
}

export const AnimalSpeciesLabels: Record<AnimalSpecies, string> = {
  [AnimalSpecies.CANINE]: "Perro",
  [AnimalSpecies.FELINE]: "Gato",
  [AnimalSpecies.RABBIT]: "Conejo",
  [AnimalSpecies.HAMSTER]: "Hámster",
  [AnimalSpecies.GUINEA_PIG]: "Cobayo / Cuyo",
  [AnimalSpecies.AVIAN]: "Ave",
  [AnimalSpecies.REPTILE]: "Reptil",
  [AnimalSpecies.EQUINE]: "Equino",
  [AnimalSpecies.BOVINE]: "Bovino",
  [AnimalSpecies.OVINE]: "Ovino",
  [AnimalSpecies.CAPRINE]: "Caprino",
  [AnimalSpecies.PORCINE]: "Porcino",
  [AnimalSpecies.CAMELID]: "Camélido",
  [AnimalSpecies.OTHER]: "Otro",
};

export interface SpeciesDetails {
  label: string;
  icon: React.ElementType;
  colorClass: string;
}

export const AnimalSpeciesDetails: Record<AnimalSpecies, SpeciesDetails> = {
  [AnimalSpecies.CANINE]: {
      label: "Perro",
      icon: Dog,
      colorClass: "bg-blue-500",
  },
  [AnimalSpecies.FELINE]: {
      label: "Gato",
      icon: Cat,
      colorClass: "bg-orange-500",
  },
  [AnimalSpecies.RABBIT]: {
      label: "Conejo",
      icon: Rabbit,
      colorClass: "bg-pink-400",
  },
  [AnimalSpecies.HAMSTER]: {
      label: "Hámster",
      icon: Mouse, 
      colorClass: "bg-yellow-500",
  },
  [AnimalSpecies.GUINEA_PIG]: {
      label: "Cobayo / Cuyo",
      icon: Squirrel,
      colorClass: "bg-amber-600",
  },
  [AnimalSpecies.AVIAN]: {
      label: "Ave",
      icon: Bird,
      colorClass: "bg-sky-400",
  },
  [AnimalSpecies.REPTILE]: {
      label: "Reptil",
      icon: Turtle,
      colorClass: "bg-green-600",
  },
  [AnimalSpecies.EQUINE]: {
      label: "Equino",
      icon: Tractor, 
      colorClass: "bg-stone-500",
  },
  [AnimalSpecies.BOVINE]: {
      label: "Bovino",
      icon: Beef,
      colorClass: "bg-gray-700",
  },
  [AnimalSpecies.OVINE]: {
      label: "Ovino",
      icon: Cloud, 
      colorClass: "bg-slate-400",
  },
  [AnimalSpecies.CAPRINE]: {
      label: "Caprino",
      icon: Mountain,
      colorClass: "bg-lime-700",
  },
  [AnimalSpecies.PORCINE]: {
      label: "Porcino",
      icon: PiggyBank,
      colorClass: "bg-rose-400",
  },
  [AnimalSpecies.CAMELID]: {
      label: "Camélido",
      icon: Package,
      colorClass: "bg-yellow-700",
  },
  [AnimalSpecies.OTHER]: {
      label: "Otro",
      icon: HelpCircle,
      colorClass: "bg-black",
  },
};

export const AnimalSpeciesOptions = (
  Object.values(AnimalSpecies) as AnimalSpecies[]
).map((value) => ({
  value,
  label: AnimalSpeciesLabels[value],
}));