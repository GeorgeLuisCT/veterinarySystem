import api from "@/services/api";
import { PaymentMethodRequest } from "../types/payment-method-request";
import { PaymentMethodResponse } from "../types/payment-method-response";

export const paymentMethodService = {
  getAll: async (): Promise<PaymentMethodResponse[]> => {
    const res = await api.get("/sales/payment-methods");
    return res.data;
  },

  getAllActive: async (): Promise<PaymentMethodResponse[]> => {
    const res = await api.get("/sales/payment-methods/active");
    return res.data;
  },

  getById: async (id: number): Promise<PaymentMethodResponse> => {
    const res = await api.get("/sales/payment-methods/get", {
      params: { id },
    });
    return res.data;
  },

  save: async (paymentMethodData: PaymentMethodRequest): Promise<PaymentMethodResponse> => {
    const res = await api.post("/sales/payment-methods", paymentMethodData);
    return res.data;
  },

  updateName: async (id: number, name: string): Promise<PaymentMethodResponse> => {
    const res = await api.put("/sales/payment-methods/update-name", null, {
      params: { id, name },
    });
    return res.data;
  },

  softDelete: async (id: number): Promise<void> => {
    await api.delete("/sales/payment-methods/soft", {
      params: { id },
    });
  },

  hardDelete: async (id: number): Promise<void> => {
    await api.delete("/sales/payment-methods/hard", {
      params: { id },
    });
  },

  restore: async (id: number): Promise<void> => {
    await api.put("/sales/payment-methods/restore", null, {
      params: { id },
    });
  },
};
