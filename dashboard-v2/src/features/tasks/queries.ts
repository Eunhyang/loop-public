import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from './api';
import type { CreateTaskDTO } from './api';
import { queryKeys } from '@/queries/keys';
import type { Task } from '@/types';

export const useTasks = (filters?: { status?: string; assignee?: string }) => {
    return useQuery({
        queryKey: queryKeys.tasks(filters),
        queryFn: () => taskApi.getTasks(filters).then(res => res.data),
    });
};

export const useTask = (id: string | null) => {
    return useQuery({
        queryKey: id ? queryKeys.task(id) : [],
        queryFn: () => taskApi.getTask(id!).then(res => res.data),
        enabled: !!id,
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
            taskApi.updateTask(id, data).then(res => res.data),
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.task(id) });
            await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
            await queryClient.cancelQueries({ queryKey: queryKeys.dashboardInit });

            // Snapshot previous value
            const previousTask = queryClient.getQueryData<Task>(queryKeys.task(id));
            const previousDashboard = queryClient.getQueryData<any>(queryKeys.dashboardInit);

            // Optimistic update for single task
            if (previousTask) {
                queryClient.setQueryData<Task>(queryKeys.task(id), {
                    ...previousTask,
                    ...data,
                });
            }

            // Optimistic update for dashboardInit (Kanban Board)
            if (previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, {
                    ...previousDashboard,
                    tasks: previousDashboard.tasks.map((t: Task) =>
                        t.entity_id === id ? { ...t, ...data } : t
                    ),
                });
            }

            return { previousTask, previousDashboard };
        },
        onError: (_err, newTodo, context) => {
            // Rollback
            if (context?.previousTask) {
                queryClient.setQueryData(queryKeys.task(newTodo.id), context.previousTask);
            }
            if (context?.previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, context.previousDashboard);
            }
        },
        onSettled: (_data, _error, variables) => {
            // Refetch / Invalidate
            queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
        },
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTaskDTO) => taskApi.createTask(data),
        onSuccess: () => {
            // Invalidate Dashboard Init (for global state refresh)
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });

            // Invalidate ALL task queries (including filtered ones)
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => taskApi.deleteTask(id),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.task(id) });
            await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
            await queryClient.cancelQueries({ queryKey: queryKeys.dashboardInit });

            // Snapshot for rollback
            const previousTask = queryClient.getQueryData<Task>(queryKeys.task(id));
            const previousDashboard = queryClient.getQueryData<any>(queryKeys.dashboardInit);

            // Optimistic removal from dashboardInit
            if (previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, {
                    ...previousDashboard,
                    tasks: previousDashboard.tasks.filter((t: Task) => t.entity_id !== id),
                });
            }

            return { previousTask, previousDashboard };
        },
        onError: (_err, _id, context) => {
            // Rollback on error
            if (context?.previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, context.previousDashboard);
            }
        },
        onSettled: () => {
            // Invalidate all task-related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
        },
    });
};
