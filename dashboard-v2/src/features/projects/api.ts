import { httpClient } from '@/services/http';
import type { Project } from '@/types';

export const projectApi = {
    getProjects: () =>
        httpClient.get<Project[]>('/api/projects'),

    getProject: (id: string) =>
        httpClient.get<Project>(`/api/projects/${id}`),
};
