import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from './api';
import { queryKeys } from '@/queries/keys';
import type { Task } from './types';

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

            // Snapshot previous value
            const previousTask = queryClient.getQueryData<Task>(queryKeys.task(id));

            // Optimistic update
            if (previousTask) {
                queryClient.setQueryData<Task>(queryKeys.task(id), {
                    ...previousTask,
                    ...data,
                });
            }

            return { previousTask };
        },
        onError: (_err, newTodo, context) => {
            // Rollback
            if (context?.previousTask) {
                queryClient.setQueryData(queryKeys.task(newTodo.id), context.previousTask);
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
