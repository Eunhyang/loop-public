import { httpClient } from '@/services/http';
import type { Project } from '@/types';

export interface CreateProjectDTO {
    entity_name: string;
    owner: string;
    parent_id?: string;
    program_id?: string;
    status: string;
    priority_flag: string;
    description?: string;
}

export const projectApi = {
    getProject: (id: string) =>
        httpClient.get<{ project: Project }>(`/api/projects/${id}`).then(res => ({ data: res.data.project })),

    createProject: (data: CreateProjectDTO) =>
        httpClient.post<{ success: boolean; project_id: string; message?: string }>('/api/projects', data),

    updateProject: (id: string, data: Partial<Project>) =>
        httpClient.put<Project>(`/api/projects/${id}`, data),
};
