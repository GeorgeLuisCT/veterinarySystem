import React from "react";
import clsx from "clsx";

interface DashboardLayoutSectionProps {
  children: React.ReactNode;
}

export default function DashboardLayoutSection({ children }: DashboardLayoutSectionProps) {
  const childrenArray = React.Children.toArray(children);

  if (childrenArray.length === 0) {
    return null;
  }

  const mainComponent = childrenArray[childrenArray.length - 1];
  const topComponents = childrenArray.slice(0, childrenArray.length - 1);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Sección de componentes opcionales */}
      {topComponents.length > 0 && (
        <div
          className={clsx(
            "grid gap-4",
            topComponents.length === 1 && "grid-cols-1",
            topComponents.length === 2 && "sm:grid-cols-2",
            topComponents.length >= 3 && "sm:grid-cols-2 md:grid-cols-3"
          )}
        >
          {topComponents.map((component, index) => (
            <div key={index} className="rounded-lg h-[200px]">
              {component}
            </div>
          ))}
        </div>
      )}

      {/* Componente principal */}
      <div className="flex-1 max-h-screen overflow-y-auto rounded-lg relative">
        <div className="absolute top-0 left-0 w-full h-full">
          {mainComponent}
        </div>
      </div>
    </div>
  );
}
