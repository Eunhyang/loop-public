import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, CreateProjectDTO } from './api';
import { queryKeys } from '@/queries/keys';

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
