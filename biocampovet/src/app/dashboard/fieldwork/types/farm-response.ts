export interface FarmSummaryResponse {
  id: number;
  name: string;
  customerId?: number | null;
  customerName?: string | null;
  zoneId?: number | null;
  zoneName?: string | null;
}

export interface FarmResponse extends FarmSummaryResponse {
  locationDescription?: string | null;
  gpsCoordinates?: string | null;
  addressLabel?: string | null;
}

export interface FarmListParams {
  page?: number;
  size?: number;
  q?: string;
  customerId?: number;
  zoneId?: number;
}

