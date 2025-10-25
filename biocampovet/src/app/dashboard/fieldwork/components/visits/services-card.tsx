"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldVisitResponse } from "../../types/visit-response";
import { AnimalSpeciesLabels } from "@/app/dashboard/patients/animals/enums/animal-species";
import { ProductUnitTypeLabels } from "@/app/dashboard/inventory/_enums/product-unit-type";
import { AdministrationRouteLabels } from "@/app/dashboard/inventory/_enums/administration-route";

export default function ServicesCard({ visit, loading }: { visit: FieldVisitResponse | null; loading: boolean; }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle>Servicios</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visit?.serviceItems?.map((si) => (
            <div key={si.id} className="rounded-md border p-3 space-y-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">{si.clinicalServiceName}</div>
                  <div className="text-sm text-muted-foreground">
                    x{si.quantity} • S/ {Number(si.unitPrice).toFixed(2)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Ejecutante: {si.performedByName ?? "—"}
                </div>
              </div>

              {si.animals?.length ? (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Animales:</span>{" "}
                  {si.animals
                    .map((animal) => {
                      const name = animal.animalName ?? `ID ${animal.animalId}`;
                      const speciesLabel =
                        animal.species && AnimalSpeciesLabels[animal.species]
                          ? ` (${AnimalSpeciesLabels[animal.species]})`
                          : "";
                      return `${name}${speciesLabel}`;
                    })
                    .join(", ")}
                </div>
              ) : null}

              {si.groups?.length ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="font-medium text-foreground">Grupos:</div>
                  <ul className="pl-4 list-disc space-y-1">
                    {si.groups.map((group) => {
                      const species = group.species ? AnimalSpeciesLabels[group.species] ?? group.species : "—";
                      const breed = group.breed ? ` · ${group.breed}` : "";
                      const count = group.quantity ?? 0;
                      const description = group.description ? ` — ${group.description}` : "";
                      return (
                        <li key={group.id}>
                          {count} × {species}
                          {breed}
                          {description}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {si.products?.length ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="font-medium text-foreground">Productos:</div>
                  <ul className="pl-4 list-disc space-y-1">
                    {si.products.map((product) => {
                      const productName = product.product?.name ?? `Producto #${product.product?.id ?? product.id}`;
                      const unitLabel = ProductUnitTypeLabels[product.unit] ?? product.unit;
                      const doseLabel = product.dose != null ? `${Number(product.dose)} ${unitLabel}` : undefined;
                      const routeLabel = product.administrationRoute
                        ? AdministrationRouteLabels[product.administrationRoute]
                        : undefined;
                      const descriptors = [doseLabel, routeLabel].filter(Boolean).join(" · ");
                      return (
                        <li key={product.id}>
                          {productName}
                          {descriptors ? ` — ${descriptors}` : ""}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {si.notes ? (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Notas:</span> {si.notes}
                </div>
              ) : null}
            </div>
          ))}
          {!loading && (visit?.serviceItems?.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground">Sin servicios aún.</div>
          )}
          {loading && <div className="text-sm text-muted-foreground">Cargando…</div>}
        </div>
      </CardContent>
    </Card>
  );
}
