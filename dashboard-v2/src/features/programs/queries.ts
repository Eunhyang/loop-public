import { useMutation, useQueryClient } from '@tanstack/react-query';
import { programApi, CreateProgramDTO } from './api';
import { queryKeys } from '@/queries/keys';

export const useCreateProgram = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProgramDTO) => programApi.createProgram(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
        },
    });
};
