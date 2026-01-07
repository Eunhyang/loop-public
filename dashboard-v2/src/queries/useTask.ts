import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';
import { queryKeys } from './keys';
import type { Task, TaskUpdatePayload } from '@/types/task';

export const useTask = (id: string | null) => {
    return useQuery({
        queryKey: id ? queryKeys.task(id) : [],
        queryFn: () => dashboardApi.getTask(id!),
        enabled: !!id,
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
            dashboardApi.updateTask(id, data),
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
        onError: (err, newTodo, context) => {
            // Rollback
            if (context?.previousTask) {
                queryClient.setQueryData(queryKeys.task(newTodo.id), context.previousTask);
            }
        },
        onSettled: (data, error, variables) => {
            // Refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
        },
    });
};
