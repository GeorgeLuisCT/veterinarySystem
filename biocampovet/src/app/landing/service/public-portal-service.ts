"use client";

import api from "@/services/api";
import type { ClinicalHistoryDetailResponse } from "@/app/dashboard/clinical/types/medical-history-response";
import type { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import type {
  PublicAnimalSummary,
  PublicAppointmentRequestPayload,
  PublicAppointmentResponse,
} from "../types/public-portal.types";
import { PublicCompanyResponse } from "../types/public-company-response";

export const PublicPortalService = {
  listBranches: async (): Promise<BranchResponse[]> => {
    const response = await api.get<BranchResponse[]>("/public/branches");
    return response.data;
  },

  findAnimals: async (
    documentTypeId: number,
    documentNumber: string,
  ): Promise<PublicAnimalSummary[]> => {
    const response = await api.get<PublicAnimalSummary[]>(
      "/public/clinical-history/animals",
      {
        params: {
          documentTypeId,
          documentNumber,
        },
      },
    );
    return response.data;
  },

  getClinicalHistory: async (params: {
    documentTypeId: number;
    documentNumber: string;
    animalId: number;
  }): Promise<ClinicalHistoryDetailResponse> => {
    const response = await api.get<ClinicalHistoryDetailResponse>(
      "/public/clinical-history",
      {
        params,
      },
    );
    return response.data;
  },

  requestAppointment: async (
    payload: PublicAppointmentRequestPayload,
  ): Promise<PublicAppointmentResponse> => {
    const response = await api.post<PublicAppointmentResponse>(
      "/public/appointments/request",
      payload,
    );
    return response.data;
  },

  getCompanyInfo: async (): Promise<PublicCompanyResponse> => {
    const response = await api.get<PublicCompanyResponse>("/public/company");
    return response.data;
  },
};

export default PublicPortalService;
