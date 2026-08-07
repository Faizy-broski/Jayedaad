import { httpClient } from './httpClient';
import { CreateTaskInput, Task, UpdateTaskInput } from '../models';

// services/api/src/tasks/tasks.repository.ts returns raw snake_case
// Supabase rows — mapped here, same convention as this file's siblings.
function mapTaskRow(row: any): Task {
  return {
    id: row.id,
    leadId: row.lead_id,
    ownerId: row.owner_id,
    title: row.title,
    dueAt: row.due_at,
    completedAt: row.completed_at,
  };
}

export const tasksRepository = {
  list: async (): Promise<Task[]> => {
    const { data } = await httpClient.get('/tasks');
    return (data ?? []).map(mapTaskRow);
  },

  create: async (input: CreateTaskInput): Promise<Task> => {
    const { data } = await httpClient.post('/tasks', input);
    return mapTaskRow(data);
  },

  update: async (id: string, input: UpdateTaskInput): Promise<Task> => {
    const { data } = await httpClient.patch(`/tasks/${id}`, input);
    return mapTaskRow(data);
  },

  complete: async (id: string): Promise<Task> => {
    const { data } = await httpClient.patch(`/tasks/${id}/complete`);
    return mapTaskRow(data);
  },

  remove: async (id: string): Promise<{ id: string }> => {
    const { data } = await httpClient.delete(`/tasks/${id}`);
    return data;
  },
};
