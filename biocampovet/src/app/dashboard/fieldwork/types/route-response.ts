export interface FieldRouteStopResponse {
  id: number;
  position: number;
  fieldVisitId: number;
  farmName?: string | null;
  eta?: string | null;
}

export interface FieldRouteDayResponse {
  id: number;
  routeDate: string;
  employeeId?: number | null;
  employeeName?: string | null;
  vehicleId?: number | null;
  vehicleName?: string | null;
  stops: FieldRouteStopResponse[];
}

