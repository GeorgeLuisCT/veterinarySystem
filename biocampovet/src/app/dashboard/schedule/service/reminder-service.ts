import api from "@/services/api";
import { PaginatedResponse } from "@/types/paginated-response";
import {
  ReminderCreateRequest,
  ReminderListItemResponse,
  ReminderListParams,
} from "../types/reminder-response";

const buildSearchParams = (params: ReminderListParams) => {
  const search = new URLSearchParams();
  const {
    page = 0,
    size = 10,
    query,
    types,
    statuses,
    dueFrom,
    dueTo,
    includeAutomatic = true,
    includeManual = true,
  } = params;

  search.append("page", String(page));
  search.append("size", String(size));

  if (query) {
    search.append("query", query.trim());
  }

  if (Array.isArray(types) && types.length > 0) {
    types.forEach((type) => search.append("types", type));
  }

  if (Array.isArray(statuses) && statuses.length > 0) {
    statuses.forEach((status) => search.append("statuses", status));
  }

  if (dueFrom) {
    search.append("dueFrom", dueFrom);
  }

  if (dueTo) {
    search.append("dueTo", dueTo);
  }

  search.append("includeManual", String(includeManual));
  search.append("includeAutomatic", String(includeAutomatic));

  return search;
};

export const ReminderService = {
  async list(params: ReminderListParams): Promise<PaginatedResponse<ReminderListItemResponse>> {
    const search = buildSearchParams(params);
    const response = await api.get<PaginatedResponse<ReminderListItemResponse>>(
      `/reminders?${search.toString()}`,
    );
    return response.data;
  },

  async create(body: ReminderCreateRequest): Promise<ReminderListItemResponse> {
    const response = await api.post<ReminderListItemResponse>("/reminders", body);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/reminders/${id}`);
  },
};

export default ReminderService;
