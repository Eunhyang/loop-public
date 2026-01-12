import { httpClient } from '@/services/http';
import type { Task, AttachmentInfo, AttachmentListResponse } from '@/types';

export interface CreateTaskDTO {
    entity_name: string;
    project_id: string;
    assignee: string;
    priority?: string;
    status?: string;
    type?: string;
    start_date?: string;
    due?: string;
    notes?: string;
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

    duplicateTask: (id: string) =>
        httpClient.post<{ new_task_id: string; source_task_id: string }>(`/api/tasks/${id}/duplicate`),

    // Attachment methods
    getAttachments: (taskId: string) =>
        httpClient.get<AttachmentListResponse>(`/api/tasks/${taskId}/attachments`).then(res => res.data),

    uploadAttachment: (taskId: string, file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);

        return httpClient.post<AttachmentInfo>(
            `/api/tasks/${taskId}/attachments`,
            formData,
            {
                headers: {
                    // Remove default Content-Type so axios sets multipart/form-data with boundary
                    'Content-Type': undefined,
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percentCompleted);
                    }
                },
            }
        ).then(res => res.data);
    },

    downloadAttachment: async (taskId: string, filename: string) => {
        const response = await httpClient.get(
            `/api/tasks/${taskId}/attachments/${encodeURIComponent(filename)}`,
            { responseType: 'blob' }
        );

        // Trigger browser download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    deleteAttachment: (taskId: string, filename: string) =>
        httpClient.delete(`/api/tasks/${taskId}/attachments/${encodeURIComponent(filename)}`),

    // Natural Language Parsing
    parseNaturalLanguage: (text: string) =>
        httpClient.post<{ success: boolean; parsed_fields: Partial<Task>; run_id?: string }>(
            '/api/tasks/parse-nl',
            { text }
        ).then(res => res.data),
};
