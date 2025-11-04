// app/dashboard/pos/_hooks/usePaymentCollector.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { PaymentMethod } from "../_types/sale-enums";
import { SalePaymentRequest } from "../_types/sale-request";

export interface PaymentEntry extends SalePaymentRequest {
  id: string; // ID local único para React
  paymentId?: number; // ID de la base de datos (SalePayment.id)
}

const generateId = () => Math.random().toString(36).slice(2, 11);

export function usePaymentCollector(initialPayments: PaymentEntry[] = []) {
  const [payments, setPayments] = useState<PaymentEntry[]>(initialPayments);

  const addPayment = useCallback((payment: Omit<PaymentEntry, "id" | "paymentId">) => {
    setPayments((prev) => [
      ...prev,
      {
        ...payment,
        id: generateId(),
        paymentId: undefined,
      },
    ]);
  }, []);

  const removePayment = useCallback((id: string) => {
    // Este remove es solo local, el de la API se maneja en la página
    setPayments((prev) => prev.filter((payment) => payment.id !== id));
  }, []);

  const resetPayments = useCallback(() => {
    setPayments([]);
  }, []);

  const setPaymentsList = useCallback((entries: PaymentEntry[]) => {
    setPayments(entries);
  }, []);

  const updatePayment = useCallback((id: string, update: Partial<SalePaymentRequest>) => {
    setPayments((prev) =>
      prev.map((payment) => (payment.id === id ? { ...payment, ...update } : payment))
    );
  }, []);

  const totals = useMemo(() => {
    const totalPaid = payments.reduce((acc, payment) => acc + payment.amount, 0);
    const byMethod = payments.reduce<Record<PaymentMethod, number>>((acc, payment) => {
      acc[payment.method] = (acc[payment.method] ?? 0) + payment.amount;
      return acc;
    }, {} as Record<PaymentMethod, number>);
    return { totalPaid, byMethod };
  }, [payments]);

  const toSalePayments = useCallback((): SalePaymentRequest[] => {
    // Quita los IDs locales (id, paymentId) antes de enviar al backend
    return payments.map(({ id, paymentId, ...rest }) => ({
      ...rest,
      paidAt: rest.paidAt ?? new Date().toISOString(),
    }));
  }, [payments]);

  const findPaymentByClientId = useCallback(
    (clientId: string) => {
      return payments.find((p) => p.id === clientId);
    },
    [payments]
  );

  return {
    payments,
    addPayment,
    removePayment,
    resetPayments,
    setPayments: setPaymentsList, // Exportando con nombre actualizado
    updatePayment,
    totals,
    toSalePayments,
    findPaymentByClientId, // Exportando la nueva función
  };
}