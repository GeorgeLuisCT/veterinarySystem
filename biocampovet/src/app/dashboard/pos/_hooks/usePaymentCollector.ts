"use client";

import { useCallback, useMemo, useState } from "react";
import { PaymentMethod } from "../_types/sale-enums";
import { SalePaymentRequest } from "../_types/sale-request";

export interface PaymentEntry extends SalePaymentRequest {
  id: string;
}

const generateId = () => Math.random().toString(36).slice(2, 11);

export function usePaymentCollector(initialPayments: PaymentEntry[] = []) {
  const [payments, setPayments] = useState<PaymentEntry[]>(initialPayments);

  const addPayment = useCallback((payment: Omit<PaymentEntry, "id">) => {
    setPayments((prev) => [...prev, { ...payment, id: generateId() }]);
  }, []);

  const removePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((payment) => payment.id !== id));
  }, []);

  const resetPayments = useCallback(() => {
    setPayments([]);
  }, []);

  const setPaymentEntries = useCallback((entries: PaymentEntry[]) => {
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
    return payments.map(({ id, ...rest }) => ({ ...rest, paidAt: rest.paidAt ?? new Date().toISOString() }));
  }, [payments]);

  return {
    payments,
    addPayment,
    removePayment,
    resetPayments,
    setPaymentEntries,
    updatePayment,
    totals,
    toSalePayments,
  };
}
