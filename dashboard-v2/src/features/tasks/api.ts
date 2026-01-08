import { httpClient } from '@/services/http';
import type { Task } from '@/types';

export interface CreateTaskDTO {
    entity_name: string;
    project_id: string;
    assignee: string;
    priority?: string;
    status?: string;
    type?: string;
    start_date?: string;
    due?: string;
}

export const taskApi = {
    getTasks: (params?: { status?: string; assignee?: string }) =>
        httpClient.get<{ tasks: Task[] }>('/api/tasks', { params }).then(res => ({ data: res.data.tasks })),

    getTask: (id: string) =>
        httpClient.get<{ task: Task }>(`/api/tasks/${id}`).then(res => ({ data: res.data.task })),

    createTask: (data: CreateTaskDTO) =>
        httpClient.post<{ success: boolean; task_id: string; file_path: string }>('/api/tasks', data),

    updateTask: (id: string, data: Partial<Task>) =>
        httpClient.put<Task>(`/api/tasks/${id}`, data),

    deleteTask: (id: string) =>
        httpClient.delete(`/api/tasks/${id}`),
};
