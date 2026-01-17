import type { DateRange } from "react-day-picker";

export enum ReportModule {
  SALES = "SALES",
  INVENTORY = "INVENTORY",
  FINANCE = "FINANCE",
  CLINIC = "CLINIC",
  FIELDWORK = "FIELDWORK",
  CASHBOX = "CASHBOX",
  CUSTOMERS = "CUSTOMERS",
  ANIMALS = "ANIMALS",
  EMPLOYEES = "EMPLOYEES",
  BRANCHES = "BRANCHES",
  USERS = "USERS",
  PUBLIC_PORTAL = "PUBLIC_PORTAL",
}

export type ReportMetric = {
  key: string;
  label: string;
  value?: number | null;
  formattedValue?: string | null;
  unit?: string | null;
  trend?: number | null;
  trendLabel?: string | null;
};

export type KeyValuePair = {
  key: string;
  value: string;
};

export type ReportBreakdownItem = {
  key: string;
  label: string;
  value?: number | null;
  formattedValue?: string | null;
  unit?: string | null;
  percentage?: number | null;
  trend?: number | null;
  metadata?: KeyValuePair[];
};

export type ReportBreakdownGroup = {
  key: string;
  title: string;
  subtitle?: string | null;
  items: ReportBreakdownItem[];
};

export type ReportSeriesPoint = {
  key: string;
  label: string;
  value: number;
};

export type ReportCollection = {
  module: ReportModule;
  title: string;
  description?: string;
  metrics: ReportMetric[];
  breakdowns: ReportBreakdownGroup[];
  timeline: ReportSeriesPoint[];
};

export type ReportFilterState = {
  from?: string | null;
  to?: string | null;
  branchIds?: number[];
  employeeIds?: number[];
  customerIds?: number[];
  animalIds?: number[];
  zoneIds?: number[];
  statuses?: string[];
  species?: string[];
  modules?: ReportModule[];
  includeVoided?: boolean;
  search?: string | null;
};

export type ReportsDashboard = {
  generatedAt: string;
  filters: ReportFilterState;
  collections: ReportCollection[];
};

export type ReportsFiltersState = {
  branchIds: number[];
  dateRange?: DateRange;
  statuses: string[];
  modules: ReportModule[];
};
