"use client";

import React from "react";
import { useSales } from "../context/sales-context-type";
import { SaleForm } from "@/app/dashboard/pos/sales/form/sale-form";
import { SalePaymentForm } from "./sale-payment-form";

export default function SalesHeader() {
  const { sales, updateSaleState, activeSaleId } = useSales();
  const currentSale = sales[activeSaleId] ?? {};

  const totalAmount =
    [...(currentSale.saleProducts ?? [])]
      .reduce((sum, item) => sum + (item.price ?? 0), 0);

  return (
    <div className="flex flex-col gap-y-2 md:flex-row md:gap-x-8 mb-8">
      {/* Parte izquierda: Cliente y animales */}
      <div className="flex-1">
        <SaleForm
          selectedCustomer={currentSale.customer}
          selectedAnimals={currentSale.animals}
          onCustomerChange={(customer) => updateSaleState({ customer })}
          onAnimalChange={(animals) => updateSaleState({ animals })}
          currentSaleId={activeSaleId}
        />
      </div>

      {/* Parte derecha: Detalles de venta */}
      <div className="flex-1">
        <SalePaymentForm totalAmount={totalAmount} currentSaleId={activeSaleId} />
      </div>
    </div>
  );
}
