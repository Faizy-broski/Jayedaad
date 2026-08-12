import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksRepository } from '../services/tasksRepository';
import { CreateTaskInput } from '../models';

// Backs the "Follow-ups" card on both dashboards — a self-scoped personal
// to-do list, optionally linked to a lead. Own tasks only; ownerId is the
// scope server-side, no filters needed here.
export function useTasksViewModel() {
  const queryClient = useQueryClient();
  const queryKey = ['tasks'];

  const query = useQuery({
    queryKey,
    queryFn: () => tasksRepository.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const create = useMutation({
    mutationFn: (input: CreateTaskInput) => tasksRepository.create(input),
    onSuccess: invalidate,
  });

  const complete = useMutation({
    mutationFn: (id: string) => tasksRepository.complete(id),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => tasksRepository.remove(id),
    onSuccess: invalidate,
  });

  const tasks = query.data ?? [];
  const openTasks = tasks.filter((t) => !t.completedAt);

  return {
    tasks,
    openTasks,
    isLoading: query.isLoading,
    isError: query.isError,
    create,
    complete,
    remove,
  };
}
