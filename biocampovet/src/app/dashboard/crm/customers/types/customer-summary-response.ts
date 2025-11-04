export interface CustomerSummaryResponse {
    id: number;
    name: string;
    documentNumber: string;
    documentTypeName: string;
    phoneNumber?: string;
    email?: string;
    isActive: boolean;
  }
  