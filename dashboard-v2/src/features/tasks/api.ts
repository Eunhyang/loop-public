import { httpClient } from '@/services/http';
import type { Task } from './types';

export const taskApi = {
    getTasks: (params?: { status?: string; assignee?: string }) =>
        httpClient.get<Task[]>('/api/tasks', { params }),

    getTask: (id: string) =>
        httpClient.get<Task>(`/api/tasks/${id}`),

    updateTask: (id: string, data: Partial<Task>) =>
        httpClient.put<Task>(`/api/tasks/${id}`, data),
};
