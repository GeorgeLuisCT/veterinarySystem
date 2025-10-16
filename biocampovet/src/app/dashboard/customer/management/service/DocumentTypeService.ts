import api from "@/services/api";
import { DocumentTypeResponse } from "../types/document-type-response";

export const DocumentTypeService = {
  getDocumentTypes: async (): Promise<DocumentTypeResponse[]> => {
    const response = await api.get<DocumentTypeResponse[]>("/document-types");
    return response.data;
  },
};

export default DocumentTypeService;
