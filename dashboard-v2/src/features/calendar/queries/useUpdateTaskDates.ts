import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../../../features/tasks/api';
import { queryKeys } from '../../../queries/keys';
import type { DashboardInitResponse } from '../../../types';
import type { Task } from '@/types';

interface UpdateTaskDatesVariables {
    taskId: string;
    start_date?: string | null;
    due?: string | null;
}

export function useUpdateTaskDates() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, start_date, due }: UpdateTaskDatesVariables) => {
            // API call
            const { data } = await taskApi.updateTask(taskId, { start_date, due });
            return data;
        },

        onMutate: async ({ taskId, start_date, due }) => {
            // Cancel outstanding refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.dashboardInit });

            // Snapshot previous value
            const previousDashboard = queryClient.getQueryData<DashboardInitResponse>(queryKeys.dashboardInit);

            // Optimistic update
            if (previousDashboard) {
                queryClient.setQueryData<DashboardInitResponse>(queryKeys.dashboardInit, (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        tasks: old.tasks.map((task: Task) =>
                            task.entity_id === taskId
                                ? { ...task, start_date: start_date ?? task.start_date, due: due ?? task.due }
                                : task
                        )
                    };
                });
            }

            return { previousDashboard };
        },

        onError: (err, _variables, context) => {
            // Rollback
            if (context?.previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, context.previousDashboard);
            }
            console.error('Failed to update task dates:', err);
        },

        onSettled: () => {
            // Invalidate to ensure consistency
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
        }
    });
}
