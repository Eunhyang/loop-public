import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programApi } from './api';
import type { CreateProgramDTO } from './api';
import { queryKeys } from '@/queries/keys';
import type { Program } from '@/types';

export const useProgram = (id: string | null) => {
    return useQuery({
        queryKey: id ? queryKeys.program(id) : [],
        queryFn: () => programApi.getProgram(id!).then(res => res.data),
        enabled: !!id,
    });
};

export const useUpdateProgram = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Program> }) =>
            programApi.updateProgram(id, data).then(res => res.data),
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.program(id) });
            await queryClient.cancelQueries({ queryKey: queryKeys.dashboardInit });

            // Snapshot previous values
            const previousProgram = queryClient.getQueryData<Program>(queryKeys.program(id));
            const previousDashboard = queryClient.getQueryData<any>(queryKeys.dashboardInit);

            // Optimistic update for single program
            if (previousProgram) {
                queryClient.setQueryData<Program>(queryKeys.program(id), {
                    ...previousProgram,
                    ...data,
                });
            }

            // Optimistic update for dashboardInit programs array
            if (previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, {
                    ...previousDashboard,
                    programs: previousDashboard.programs.map((p: Program) =>
                        p.entity_id === id ? { ...p, ...data } : p
                    ),
                });
            }

            return { previousProgram, previousDashboard };
        },
        onError: (_err, variables, context) => {
            // Rollback on error
            if (context?.previousProgram) {
                queryClient.setQueryData(queryKeys.program(variables.id), context.previousProgram);
            }
            if (context?.previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, context.previousDashboard);
            }
        },
        onSettled: (_data, _error, variables) => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: queryKeys.program(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
        },
    });
};

export const useCreateProgram = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProgramDTO) => programApi.createProgram(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
        },
    });
};
