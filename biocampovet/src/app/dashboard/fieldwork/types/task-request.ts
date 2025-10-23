import { z } from 'zod';
import { FieldTaskPriority } from '../enums/field-task-priority';
import { FieldTaskStatus } from '../enums/field-task-status';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Ingresa un título'),
  zoneId: z.number().int().positive().optional(),
  farmIds: z.array(z.number().int().positive()).min(1, 'Selecciona al menos una finca'),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(FieldTaskPriority),
  status: z.nativeEnum(FieldTaskStatus).default(FieldTaskStatus.PENDING),
  dueAt: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Ingresa un título'),
  zoneId: z.number().int().positive().optional(),
  farmId: z.number().int().positive(),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(FieldTaskPriority),
  status: z.nativeEnum(FieldTaskStatus),
  dueAt: z.string().optional(),
});

export const assignTaskSchema = z.object({
  fieldVetId: z.number().int().positive(),
  vehicleId: z.number().int().positive().optional(),
  companionIds: z.array(z.number().int().positive()).optional().default([]),
  scheduledDateTime: z.string(),
  objective: z.string().max(1000).optional(),
});

export type CreateTaskRequest = z.infer<typeof createTaskSchema>;
export type UpdateTaskRequest = z.infer<typeof updateTaskSchema>;
export type AssignTaskRequest = z.infer<typeof assignTaskSchema>;
