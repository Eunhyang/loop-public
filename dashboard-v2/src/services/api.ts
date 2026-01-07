import { httpClient } from './http';
import type { DashboardInitResponse, Task, Project } from '@/types';

export const dashboardApi = {
  // Initial dashboard data (single call for performance)
  getDashboardInit: () =>
    httpClient.get<DashboardInitResponse>('/api/dashboard-init'),

  // Tasks
  getTasks: (params?: { status?: string; assignee?: string }) =>
    httpClient.get<Task[]>('/api/tasks', { params }),

  getTask: (id: string) =>
    httpClient.get<Task>(`/api/tasks/${id}`),

  updateTask: (id: string, data: Partial<Task>) =>
    httpClient.put<Task>(`/api/tasks/${id}`, data),

  // Projects
  getProjects: () =>
    httpClient.get<Project[]>('/api/projects'),

  getProject: (id: string) =>
    httpClient.get<Project>(`/api/projects/${id}`),

  // Pending reviews
  getPendingReviews: () =>
    httpClient.get('/api/pending'),

  // Individual Task Operations
  updateTask: (id: string, data: Partial<Task>) =>
    httpClient.patch<Task>(`/api/tasks/${id}`, data),
};
