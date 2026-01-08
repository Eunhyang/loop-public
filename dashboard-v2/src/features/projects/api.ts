import { httpClient } from '@/services/http';
import type { Project } from '@/types';

export interface CreateProjectDTO {
    entity_name: string;
    owner: string;
    parent_id?: string;
    status: string;
    priority_flag: string;
    description?: string;
}

export const projectApi = {
    createProject: (data: CreateProjectDTO) =>
        httpClient.post<{ success: boolean; project_id: string; message?: string }>('/api/projects', data),
};
