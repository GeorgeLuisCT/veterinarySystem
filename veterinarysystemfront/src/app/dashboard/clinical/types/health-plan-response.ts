export interface HealthPlanServiceItemResponse {
  id: number;
  clinicalServiceId: number;
  clinicalServiceName: string;
  quantity: number;
  notes?: string | null;
}

export interface HealthPlanResponse {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  notes?: string | null;
  serviceItems: HealthPlanServiceItemResponse[];
}

export interface HealthPlanListParams {
  page?: number;
  size?: number;
  q?: string;
}
