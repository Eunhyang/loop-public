import { httpClient } from '@/services/http';

export interface CreateProgramDTO {
    entity_name: string;
    program_type: string;
    owner: string;
    description?: string;
    principles?: string[];
    process_steps?: any[];
}

export const programApi = {
    createProgram: (data: CreateProgramDTO) =>
        httpClient.post<{ success: boolean; program_id: string; message?: string }>('/api/programs', data),
};
