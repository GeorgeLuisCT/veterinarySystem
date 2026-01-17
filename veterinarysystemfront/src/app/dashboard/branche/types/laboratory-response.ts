export interface LaboratoryResponse {
  id: number;
  name: string;
  branchId?: number | null;
  branchName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
}
