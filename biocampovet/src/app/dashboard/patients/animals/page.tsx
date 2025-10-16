'use client';

import DashboardLayoutSection from "../../dashboard-layout-section";
import { AnimalNavigation } from "./components/animal-navigation";
import MainAnimals from "./components/main-animals";
import { AnimalProvider } from "./context/animal-context";

export default function AnimalPage() {

  return (
    <AnimalProvider>
      <AnimalNavigation />
      <DashboardLayoutSection>
        <MainAnimals />
      </DashboardLayoutSection>
    </AnimalProvider>
  );
}
