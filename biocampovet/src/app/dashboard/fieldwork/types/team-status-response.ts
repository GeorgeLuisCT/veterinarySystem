import { FieldTeamStatus } from '../enums/field-team-status';

export interface TeamStatusResponse {
  employeeId: number;
  employeeName: string;
  status: FieldTeamStatus;
  currentVisitId?: number | null;
  currentVisitFarmId?: number | null;
  currentVisitFarmName?: string | null;
  currentVisitZoneId?: number | null;
  currentVisitZoneName?: string | null;
  locationText?: string | null;
  gpsCoordinates?: string | null;
}
