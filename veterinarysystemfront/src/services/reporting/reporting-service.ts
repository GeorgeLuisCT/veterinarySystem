import api from "@/services/api";
import { ReportModule, ReportsDashboard, ReportsFiltersState } from "@/types/reporting";

type GraphQLPayload<T> = {
  data?: T;
  errors?: { message: string }[];
};

const REPORTS_DASHBOARD_QUERY = `
  query ReportsDashboard($filters: ReportFiltersInput) {
    reportsDashboard(filters: $filters) {
      generatedAt
      filters {
        from
        to
        branchIds
        statuses
        modules
      }
      collections {
        module
        title
        description
        metrics {
          key
          label
          value
          formattedValue
          unit
          trend
          trendLabel
        }
        breakdowns {
          key
          title
          subtitle
          items {
            key
            label
            value
            formattedValue
            unit
            percentage
            trend
            metadata {
              key
              value
            }
          }
        }
        timeline {
          key
          label
          value
        }
      }
    }
  }
`;

export async function fetchReportsDashboard(filters: ReportsFiltersState): Promise<ReportsDashboard> {
  const payload = {
    query: REPORTS_DASHBOARD_QUERY,
    variables: {
      filters: serializeFilters(filters),
    },
  };

  const response = await api.post<GraphQLPayload<{ reportsDashboard: ReportsDashboard }>>("/reports/graphql", payload);

  if (response.data.errors?.length) {
    throw new Error(response.data.errors.map((err) => err.message).join(" | "));
  }

  if (!response.data.data?.reportsDashboard) {
    throw new Error("No se recibió información del módulo de reportes.");
  }

  return response.data.data.reportsDashboard;
}

function serializeFilters(filters: ReportsFiltersState) {
  const { dateRange, branchIds, statuses, modules } = filters;

  const from = dateRange?.from ? dateRange.from.toISOString() : undefined;
  const to = dateRange?.to ? dateRange.to.toISOString() : undefined;

  return {
    from,
    to,
    branchIds: branchIds.length ? branchIds : undefined,
    statuses: statuses.length ? statuses.map((status) => status.toUpperCase()) : undefined,
    modules: modules.length ? modules : Object.values(ReportModule),
  };
}
