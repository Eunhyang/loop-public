import { httpClient } from '@/services/http';
import type { Program } from '@/types';

export interface CreateProgramDTO {
    entity_name: string;
    program_type: string;
    owner: string;
    description?: string;
    principles?: string[];
    process_steps?: any[];
}

export const programApi = {
    getProgram: (id: string) =>
        httpClient.get<{ program: Program }>(`/api/programs/${id}`).then(res => ({ data: res.data.program })),

    createProgram: (data: CreateProgramDTO) =>
        httpClient.post<{ success: boolean; program_id: string; message?: string }>('/api/programs', data),

    updateProgram: (id: string, data: Partial<Program>) =>
        httpClient.put<Program>(`/api/programs/${id}`, data),
};
