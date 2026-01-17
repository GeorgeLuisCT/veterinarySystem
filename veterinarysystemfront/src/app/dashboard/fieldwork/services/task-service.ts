import api from '@/services/api';
import { PaginatedResponse } from '@/types/paginated-response';
import { FieldTaskResponse, FieldTaskSummaryResponse } from '../types/task-response';
import { AssignTaskRequest, CreateTaskRequest, UpdateTaskRequest } from '../types/task-request';
import { FieldTaskPriority } from '../enums/field-task-priority';
import { FieldTaskStatus } from '../enums/field-task-status';
import { FieldVisitSummaryResponse } from '../types/visit-response';

export interface TaskListParams {
  page?: number;
  size?: number;
  q?: string;
  status?: FieldTaskStatus;
  priority?: FieldTaskPriority;
  assignedToId?: number;
  farmId?: number;
  zoneId?: number;
  dueFrom?: string;
  dueTo?: string;
}

export const TaskService = {
  list: async (params: TaskListParams): Promise<PaginatedResponse<FieldTaskSummaryResponse>> => {
    const response = await api.get<PaginatedResponse<FieldTaskSummaryResponse>>('/fieldwork/tasks', { params });
    return response.data;
  },
  get: async (id: number): Promise<FieldTaskResponse> => {
    const response = await api.get<FieldTaskResponse>('/fieldwork/tasks/detail', { params: { id } });
    return response.data;
  },
  create: async (data: CreateTaskRequest, createdById?: number): Promise<FieldTaskResponse[]> => {
    const response = await api.post<FieldTaskResponse[]>('/fieldwork/tasks', data, { params: { createdById } });
    return response.data;
  },
  update: async (id: number, data: UpdateTaskRequest): Promise<FieldTaskResponse> => {
    const response = await api.put<FieldTaskResponse>('/fieldwork/tasks', data, { params: { id } });
    return response.data;
  },
  assign: async (taskId: number, data: AssignTaskRequest, assignedById?: number): Promise<FieldVisitSummaryResponse> => {
    const response = await api.post<FieldVisitSummaryResponse>('/fieldwork/tasks/assign', data, { params: { taskId, assignedById } });
    return response.data;
  },
  delete: async (id: number): Promise<FieldTaskSummaryResponse> => {
    const response = await api.delete<FieldTaskSummaryResponse>('/fieldwork/tasks', { params: { id } });
    return response.data;
  },
};

export default TaskService;
