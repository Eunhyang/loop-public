import { httpClient } from '@/services/http';
import type { Project, ExpectedImpact } from '@/types';

export interface CreateProjectDTO {
    entity_name: string;
    owner: string;
    parent_id?: string;
    program_id?: string;
    status: string;
    priority_flag: string;
    description?: string;
    expected_impact: ExpectedImpact;
    validates: string[];
    primary_hypothesis_id: string;
    conditions_3y?: string[];
    autofill_expected_impact?: boolean;
}

export const projectApi = {
    getProject: (id: string) =>
        httpClient.get<{ project: Project }>(`/api/projects/${id}`).then(res => ({ data: res.data.project })),

    createProject: (data: CreateProjectDTO) =>
        httpClient.post<{ success: boolean; project_id: string; message?: string; expected_score?: number }>('/api/projects', {
            entity_name: data.entity_name,
            owner: data.owner,
            parent_id: data.parent_id,
            program_id: data.program_id,
            status: data.status,
            priority_flag: data.priority_flag,
            description: data.description,
            expected_impact: data.expected_impact,
            validates: data.validates,
            primary_hypothesis_id: data.primary_hypothesis_id,
            conditions_3y: data.conditions_3y || [],
            autofill_expected_impact: data.autofill_expected_impact ?? false,
            // API expects priority field to map to priority_flag in frontmatter
            priority: data.priority_flag,
        }),

    updateProject: (id: string, data: Partial<Project>) =>
        httpClient.put<Project>(`/api/projects/${id}`, data),

    deleteProject: (id: string, force: boolean = false) =>
        httpClient.delete<{ success: boolean; message: string }>(`/api/projects/${id}${force ? '?force=true' : ''}`),
};
