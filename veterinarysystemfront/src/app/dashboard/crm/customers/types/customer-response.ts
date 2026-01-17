import { DocumentTypeResponse } from "./document-type-response";

export interface CustomerResponse {
  id: number;
  name: string;
  documentType: DocumentTypeResponse;
  documentNumber: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  isActive: boolean;
}
