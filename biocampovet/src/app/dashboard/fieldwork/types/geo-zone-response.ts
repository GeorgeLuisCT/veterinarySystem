import type { z } from 'zod';
import { GeoZoneType } from '../enums/geo-zone-type';

export interface GeoZoneSummaryResponse {
  id: number;
  name: string;
  type: GeoZoneType;
  parentId?: number | null;
  parentName?: string | null;
  active: boolean;
}

export interface GeoZoneResponse extends GeoZoneSummaryResponse {
  gpsCoordinates?: string | null;
}

export interface GeoZoneListParams {
  page?: number;
  size?: number;
  q?: string;
  type?: GeoZoneType;
  parentId?: number;
  active?: boolean;
}

