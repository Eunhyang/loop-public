import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from './api';
import type { CreateProjectDTO } from './api';
import { queryKeys } from '@/queries/keys';
import type { Project } from '@/types';
import { httpClient } from '@/services/http';

export const useProject = (id: string | null) => {
    return useQuery({
        queryKey: id ? queryKeys.project(id) : [],
        queryFn: () => projectApi.getProject(id!).then(res => res.data),
        enabled: !!id,
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
            projectApi.updateProject(id, data).then(res => res.data),
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.project(id) });
            await queryClient.cancelQueries({ queryKey: queryKeys.dashboardInit });

            // Snapshot previous values
            const previousProject = queryClient.getQueryData<Project>(queryKeys.project(id));
            const previousDashboard = queryClient.getQueryData<any>(queryKeys.dashboardInit);

            // Optimistic update for single project
            if (previousProject) {
                queryClient.setQueryData<Project>(queryKeys.project(id), {
                    ...previousProject,
                    ...data,
                });
            }

            // Optimistic update for dashboardInit projects array
            if (previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, {
                    ...previousDashboard,
                    projects: previousDashboard.projects.map((p: Project) =>
                        p.entity_id === id ? { ...p, ...data } : p
                    ),
                });
            }

            return { previousProject, previousDashboard };
        },
        onError: (_err, variables, context) => {
            // Rollback on error
            if (context?.previousProject) {
                queryClient.setQueryData(queryKeys.project(variables.id), context.previousProject);
            }
            if (context?.previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, context.previousDashboard);
            }
        },
        onSettled: (_data, _error, variables) => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: queryKeys.project(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
        },
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProjectDTO) => projectApi.createProject(data),
        onSuccess: () => {
            // 1. Invalidate Dashboard Init (legacy parity - structure reload)
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });

            // 2. Invalidate Projects list (if exists separately)
            queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
        },
    });
};

export const usePrograms = () => {
    return useQuery({
        queryKey: ['programs'],
        queryFn: () => httpClient.get<{ programs: Array<{ entity_id: string; entity_name: string }> }>('/api/programs')
            .then(res => res.data.programs),
        staleTime: 5 * 60 * 1000, // 5 minutes - Programs don't change often
    });
};
