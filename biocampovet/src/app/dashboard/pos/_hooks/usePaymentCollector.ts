"use client";

import { useCallback, useMemo, useState } from "react";
import { PaymentMethod } from "../_types/sale-enums";
import { SalePaymentRequest } from "../_types/sale-request";

export interface PaymentEntry extends SalePaymentRequest {
  id: string;
  paymentId?: number;
}

const generateId = () => `local-${Math.random().toString(36).slice(2, 11)}`;

export function usePaymentCollector(initialPayments: PaymentEntry[] = []) {
  const [payments, setPayments] = useState<PaymentEntry[]>(initialPayments);

  const addPayment = useCallback((payment: Omit<PaymentEntry, "id" | "paymentId">): PaymentEntry => {
    const newPayment: PaymentEntry = {
      ...payment,
      id: generateId(),
      paymentId: undefined,
    };

    setPayments((prev) => [
      ...prev,
      newPayment,
    ]);

    return newPayment;
  }, []);

  const removePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((payment) => payment.id !== id));
  }, []);

  const resetPayments = useCallback(() => {
    setPayments([]);
  }, []);

  const uniqByPayment = (list: PaymentEntry[]) => {
    const seen = new Set<string>();
    return list.filter((p) => {
      const k = p.paymentId ? `db-${p.paymentId}` : p.id;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const setPaymentsList = useCallback((entries: PaymentEntry[]) => {
    setPayments(uniqByPayment(entries));
  }, []);

  const updatePayment = useCallback((id: string, update: Partial<SalePaymentRequest>) => {
    setPayments((prev) =>
      prev.map((payment) => (payment.id === id ? { ...payment, ...update } : payment))
    );
  }, []);

  const updatePaymentId = useCallback((localId: string, dbId: number) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === localId ? { ...payment, paymentId: dbId } : payment
      )
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
    return payments.map(({ id, paymentId, ...rest }) => {
      void id;
      void paymentId;
      return {
        ...rest,
        paidAt: rest.paidAt ?? new Date().toISOString(),
      };
    });
  }, [payments]);

  const findPaymentByClientId = useCallback(
    (clientId: string) => {
      return payments.find((p) => p.id === clientId);
    },
    [payments]
  );

  const findPaymentByDbId = useCallback(
    (dbId: number) => {
      return payments.find((p) => p.paymentId === dbId);
    },
    [payments]
  );

  return {
    payments,
    addPayment,
    removePayment,
    resetPayments,
    setPayments: setPaymentsList,
    updatePayment,
    totals,
    toSalePayments,
    findPaymentByClientId,
    updatePaymentId,
    findPaymentByDbId,
  };
}