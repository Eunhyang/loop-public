import { httpClient } from '@/services/http';
import type { Project, Task, Hypothesis, Track } from '@/types';

export interface CreateProjectDTO {
    entity_name: string;
    owner: string;
    parent_id?: string;
    program_id?: string;
    status: string;
    priority_flag: string;
    description?: string;
}

export interface ProjectContextResponse {
    project: Project;
    tasks: Task[];
    hypotheses: Hypothesis[];
    parent_track: Track | null;
}

export const projectApi = {
    getProject: (id: string) =>
        httpClient.get<{ project: Project }>(`/api/projects/${id}`).then(res => ({ data: res.data.project })),

    getProjectContext: (id: string) =>
        httpClient.get<ProjectContextResponse>(`/api/projects/${id}/context`).then(res => res.data),

    createProject: (data: CreateProjectDTO) =>
        httpClient.post<{ success: boolean; project_id: string; message?: string }>('/api/projects', data),

    updateProject: (id: string, data: Partial<Project>) =>
        httpClient.put<Project>(`/api/projects/${id}`, data),

    deleteProject: (id: string, force: boolean = false) =>
        httpClient.delete<{ success: boolean; message: string }>(`/api/projects/${id}${force ? '?force=true' : ''}`),
};
