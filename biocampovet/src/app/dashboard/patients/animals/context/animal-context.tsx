import React, { createContext, useContext, useState } from "react";
import { AnimalSummaryResponse } from "../types/animal-summary-response";
import { PaginatedResponse } from "@/types/paginated-response";

interface AnimalContextType {
  animals: PaginatedResponse<AnimalSummaryResponse>;
  setAnimals: React.Dispatch<React.SetStateAction<PaginatedResponse<AnimalSummaryResponse>>>;
  addAnimal: (animal: AnimalSummaryResponse) => void;
  removeAnimal: (id: number) => void;
  updateAnimal: (animal: AnimalSummaryResponse) => void;
}

const AnimalContext = createContext<AnimalContextType | undefined>(undefined);

export const useAnimalContext = () => {
  const context = useContext(AnimalContext);
  if (!context) throw new Error("useAnimalContext debe usarse dentro de AnimalProvider");
  return context;
};

export const AnimalProvider = ({ children }: { children: React.ReactNode }) => {
  const [animals, setAnimals] = useState<PaginatedResponse<AnimalSummaryResponse>>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    pageSize: 0,
    currentPage: 0,
  });

  const addAnimal = (animal: AnimalSummaryResponse) => {
    setAnimals(prev => ({
      ...prev,
      content: [animal, ...prev.content],
    }));
  };

  const removeAnimal = (id: number) => {
    setAnimals(prev => ({
      ...prev,
      content: prev.content.filter(a => a.id !== id),
    }));
  };

  const updateAnimal = (updated: AnimalSummaryResponse) => {
    setAnimals(prev => ({
      ...prev,
      content: prev.content.map(a => (a.id === updated.id ? updated : a)),
    }));
  };

  return (
    <AnimalContext.Provider
      value={{ animals, setAnimals, addAnimal, removeAnimal, updateAnimal }}
    >
      {children}
    </AnimalContext.Provider>
  );
};
